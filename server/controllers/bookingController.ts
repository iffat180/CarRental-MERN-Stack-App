import mongoose, { type ClientSession, type Types } from "mongoose";
import type { Request, Response } from "express";
import Booking, { type BookingDocument } from "../models/Booking.js";
import Car from "../models/Car.js";
import { errCode, errMessage, errName } from "../utils/errors.js";
import { notifyOwner } from "../realtime.js";

type IdLike = Types.ObjectId | string;
type DateLike = Date | string;

// ============================================
// IN-MEMORY AVAILABILITY LOCK MAP
// ============================================
// Lock format: Map<lockKey, { expiresAt: timestamp, createdAt: timestamp }>
// lockKey: `${carId}_${pickupDateISO}_${returnDateISO}`
// TTL: 30 seconds (prevents race conditions during booking creation)
// RISK: In-memory map resets on server restart - locks will be lost, but this is acceptable
//       as TTL expiry (30s) is short enough that restart impact is minimal
interface Lock {
  expiresAt: number;
  createdAt: number;
}
const availabilityLockMap = new Map<string, Lock>();
const LOCK_TTL_MS = 30000; // 30 seconds (exactly as specified)

// Helper: Generate lock key from car ID and date range
const generateLockKey = (carId: IdLike, pickupDate: DateLike, returnDate: DateLike): string => {
  const pickupISO = new Date(pickupDate).toISOString();
  const returnISO = new Date(returnDate).toISOString();
  return `${carId}_${pickupISO}_${returnISO}`;
};

// Helper: Check if lock exists and is still valid (not expired)
const isLocked = (lockKey: string): boolean => {
  const lock = availabilityLockMap.get(lockKey);
  if (!lock) {
    return false; // No lock exists
  }

  const now = Date.now();
  if (now >= lock.expiresAt) {
    // Lock expired - remove it and return false
    availabilityLockMap.delete(lockKey);
    console.log(`[AvailabilityLock] TTL expiry - Lock expired and removed`, {
      lockKey,
      expiresAt: new Date(lock.expiresAt).toISOString(),
      createdAt: new Date(lock.createdAt).toISOString(),
      timestamp: new Date().toISOString(),
    });
    return false;
  }

  return true; // Lock exists and is valid
};

// Helper: Acquire lock (set lock with TTL)
const acquireLock = (lockKey: string): void => {
  const now = Date.now();
  const lock = {
    expiresAt: now + LOCK_TTL_MS,
    createdAt: now,
  };
  availabilityLockMap.set(lockKey, lock);
  console.log(`[AvailabilityLock] Lock acquired`, {
    lockKey,
    expiresAt: new Date(lock.expiresAt).toISOString(),
    ttlSeconds: LOCK_TTL_MS / 1000,
    timestamp: new Date().toISOString(),
  });
};

// Helper: Release lock
const releaseLock = (lockKey: string): void => {
  if (availabilityLockMap.has(lockKey)) {
    availabilityLockMap.delete(lockKey);
    console.log(`[AvailabilityLock] Lock released`, {
      lockKey,
      timestamp: new Date().toISOString(),
    });
  }
};

// ============================================
// BOOKING CORE — availability + atomic creation
// ============================================

// Only these statuses occupy a car. cancelled / completed bookings must not
// block new bookings for the same dates.
const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed"] as const;

// Two date ranges overlap when each starts strictly before the other ends.
// Exclusive bounds (`$lt` / `$gt`) mean a same-day handoff — one booking ends
// the day the next begins — is NOT treated as a conflict.
const overlapFilter = (pickup: Date, drop: Date) => ({
  status: { $in: ACTIVE_BOOKING_STATUSES },
  pickupDate: { $lt: drop },
  returnDate: { $gt: pickup },
});

// Typed error so route handlers can map a cause to an HTTP status.
class BookingError extends Error {
  statusCode: number;
  code: string;
  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "BookingError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

// Everything needed to create a booking. Extra detail fields (userDetails, etc.)
// are passed straight through to the Booking model.
export interface BookingInput {
  car: IdLike;
  user: IdLike;
  pickupDate: DateLike;
  returnDate: DateLike;
  status?: string;
  userDetails?: unknown;
  pickupDetails?: unknown;
  returnDetails?: unknown;
  extras?: unknown;
  notes?: string;
}

// True when the failure is "this MongoDB isn't a replica set" — i.e. a local
// standalone mongod that can't run transactions. Lets dev environments fall
// back gracefully; Atlas and the CI in-memory replica set are unaffected.
const isNoReplicaSetError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  const e = err as { message?: string; code?: number; codeName?: string };
  const msg = String(e.message || "");
  return (
    e.code === 20 ||
    e.codeName === "IllegalOperation" ||
    /replica set|Transaction numbers are only allowed|mongos/i.test(msg)
  );
};

// Function to Check Availability of Car for a given Date range.
// Returns true when the car has no active booking overlapping [pickup, return).
const checkAvailability = async (
  car: IdLike,
  pickupDate: DateLike,
  returnDate: DateLike,
  session: ClientSession | null = null
): Promise<boolean> => {
  const query = Booking.findOne({
    car,
    ...overlapFilter(new Date(pickupDate), new Date(returnDate)),
  });
  if (session) query.session(session);
  const clash = await query;
  return !clash;
};

// Non-transactional creation path — only reached on a standalone mongod (dev).
// The unique partial index on Booking is still the last-resort backstop here.
const createBookingNonTransactional = async (
  bookingData: BookingInput
): Promise<BookingDocument> => {
  const { car, pickupDate, returnDate } = bookingData;
  const pickup = new Date(pickupDate);
  const drop = new Date(returnDate);

  const clash = await Booking.findOne({ car, ...overlapFilter(pickup, drop) });
  if (clash) {
    throw new BookingError("Car is not available for the selected dates", 409, "CAR_UNAVAILABLE");
  }

  const carDoc = await Car.findById(car);
  if (!carDoc) throw new BookingError("Car not found", 404, "CAR_NOT_FOUND");

  const msPerDay = 1000 * 60 * 60 * 24;
  const noOfDays = Math.max(1, Math.ceil((drop.getTime() - pickup.getTime()) / msPerDay));
  return Booking.create({
    ...bookingData,
    owner: carDoc.owner,
    price: carDoc.pricePerDay * noOfDays,
  }) as unknown as BookingDocument;
};

/**
 * Create a booking atomically.
 *
 * Runs the availability check and the insert inside one MongoDB transaction
 * (snapshot reads, majority writes). To stop two concurrent transactions for
 * the same car from both passing the snapshot-isolated overlap check (a "write
 * skew" — they insert different documents so MongoDB sees no direct conflict),
 * every attempt also does `$inc: { bookingGuard: 1 }` on the shared Car
 * document. Concurrent bookings for the same car therefore collide on that one
 * write; MongoDB aborts the loser with a WriteConflict, `withTransaction`
 * retries it, and the retry sees the winner's booking and is rejected.
 *
 * @returns {Promise<import('mongoose').Document>} the created booking
 * @throws {BookingError} CAR_UNAVAILABLE (409) | CAR_NOT_FOUND (404)
 */
const createBookingAtomic = async (bookingData: BookingInput): Promise<BookingDocument> => {
  const { car, pickupDate, returnDate } = bookingData;
  const pickup = new Date(pickupDate);
  const drop = new Date(returnDate);

  const session = await mongoose.startSession();
  try {
    let createdBooking: BookingDocument | null = null;

    await session.withTransaction(
      async () => {
        // 1. Overlap check against this transaction's snapshot.
        const clash = await Booking.findOne({ car, ...overlapFilter(pickup, drop) }).session(
          session
        );
        if (clash) {
          throw new BookingError(
            "Car is not available for the selected dates",
            409,
            "CAR_UNAVAILABLE"
          );
        }

        // 2. Load the car (in-transaction) for price + owner.
        const carDoc = await Car.findById(car).session(session);
        if (!carDoc) throw new BookingError("Car not found", 404, "CAR_NOT_FOUND");

        // 3. Materialise a conflict point for concurrent bookings of this car.
        await Car.updateOne({ _id: car }, { $inc: { bookingGuard: 1 } }, { session });

        // 4. Price.
        const msPerDay = 1000 * 60 * 60 * 24;
        const noOfDays = Math.max(1, Math.ceil((drop.getTime() - pickup.getTime()) / msPerDay));

        // 5. Insert the booking in the same transaction.
        const [doc] = await Booking.create(
          [{ ...bookingData, owner: carDoc.owner, price: carDoc.pricePerDay * noOfDays }],
          { session }
        );
        createdBooking = (doc as BookingDocument) ?? null;
      },
      { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } }
    );

    if (!createdBooking)
      throw new BookingError("Booking could not be created", 500, "BOOKING_FAILED");
    return createdBooking;
  } catch (err) {
    if (isNoReplicaSetError(err)) {
      console.warn(
        "[createBookingAtomic] MongoDB is not a replica set — falling back to non-transactional create (dev only)"
      );
      return createBookingNonTransactional(bookingData);
    }
    throw err;
  } finally {
    await session.endSession();
  }
};

// Shared date-range validation for booking endpoints.
const validateBookingDates = (pickupDate: DateLike, returnDate: DateLike): string | null => {
  const pickup = new Date(pickupDate);
  const drop = new Date(returnDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(pickup.getTime()) || Number.isNaN(drop.getTime())) {
    return "Invalid pickup or return date";
  }
  if (pickup < today) return "Pickup date cannot be in the past";
  if (drop <= pickup) return "Return date must be after pickup date";
  return null;
};

// Maps a booking-creation failure to an HTTP response.
const handleBookingError = (res: Response, error: unknown, label: string): void => {
  if (error instanceof BookingError) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }
  const code = errCode(error);
  if (code === 11000 || code === 11001) {
    res.status(409).json({
      success: false,
      message: "This car is already booked for the selected dates",
    });
    return;
  }
  console.error(`[${label}] Error:`, {
    message: errMessage(error),
    name: errName(error),
    code,
    stack:
      process.env.NODE_ENV === "development" && error instanceof Error && error instanceof Error
        ? error.stack
        : undefined,
    timestamp: new Date().toISOString(),
  });
  res.status(500).json({ success: false, message: "Failed to create booking. Please try again." });
};

// API to Check Availability of Cars for the given Date and location
export const checkAvailabilityOfCar = async (req: Request, res: Response) => {
  try {
    const { location, pickupDate, returnDate } = req.body;

    // Validate date business logic
    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validate pickupDate is not in the past
    if (pickup < today) {
      return res.status(400).json({
        success: false,
        message: "Pickup date cannot be in the past",
      });
    }

    // Validate returnDate is after pickupDate
    if (returnD <= pickup) {
      return res.status(400).json({
        success: false,
        message: "Return date must be after pickup date",
      });
    }

    // fetch all available cars for the given location
    const cars = await Car.find({ location, isAvailable: true });

    // check car availability for the given date range using promise
    const availableCarsPromises = cars.map(async (car) => {
      const isAvailable = await checkAvailability(car._id, pickupDate, returnDate);
      return { ...car.toObject(), isAvailable };
    });

    let availableCars = await Promise.all(availableCarsPromises);
    availableCars = availableCars.filter((car) => car.isAvailable === true);

    res.json({ success: true, availableCars });
  } catch (error) {
    console.error(`[checkAvailabilityOfCar] Error:`, {
      message: errMessage(error),
      name: errName(error),
      stack:
        process.env.NODE_ENV === "development" && error instanceof Error && error instanceof Error
          ? error.stack
          : undefined,
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({ success: false, message: "Failed to check car availability." });
  }
};

/// Create Booking API (basic — car + dates only)
export const createBooking = async (req: Request, res: Response) => {
  try {
    const { _id } = req.user!;
    const { car, pickupDate, returnDate } = req.body;

    const dateError = validateBookingDates(pickupDate, returnDate);
    if (dateError) {
      return res.status(400).json({ success: false, message: dateError });
    }

    const booking = await createBookingAtomic({ car, user: _id, pickupDate, returnDate });
    notifyOwner(booking.owner, { type: "booking.created", bookingId: String(booking._id) });

    return res.json({ success: true, bookingId: booking._id, message: "Booking Created" });
  } catch (error) {
    return handleBookingError(res, error, "createBooking");
  }
};

// API to List User Bookings
export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const { _id } = req.user!;
    const bookings = await Booking.find({ user: _id }).populate("car").sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    console.error(`[getUserBookings] Error:`, {
      message: errMessage(error),
      name: errName(error),
      stack:
        process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({ success: false, message: "Failed to retrieve bookings." });
  }
};

// API to get Owner Bookings
export const getOwnerBookings = async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== "owner") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    const bookings = await Booking.find({ owner: req.user!._id })
      .populate("car user")
      .select("-user.password")
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    console.error(`[getOwnerBookings] Error:`, {
      message: errMessage(error),
      name: errName(error),
      stack:
        process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({ success: false, message: "Failed to retrieve bookings." });
  }
};

// API to change booking status
export const changeBookingStatus = async (req: Request, res: Response) => {
  try {
    const { _id } = req.user!;
    const { id: bookingId } = req.params;
    const { status } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.owner.toString() !== _id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    booking.status = status;
    // Same as cancelling: a booking in progress or finished must still accept a new status
    await booking.save({ validateModifiedOnly: true });
    notifyOwner(booking.owner, { type: "booking.updated", bookingId: String(booking._id) });

    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    console.error(`[changeBookingStatus] Error:`, {
      message: errMessage(error),
      name: errName(error),
      stack:
        process.env.NODE_ENV === "development" && error instanceof Error && error instanceof Error
          ? error.stack
          : undefined,
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({ success: false, message: "Failed to update booking status." });
  }
};

// Create Booking with Details API
//
// Concurrency strategy (three layers):
//   1. in-memory lock  — cheap per-instance fast-fail for a burst of identical
//                        requests, so we don't even open a transaction
//   2. transaction     — createBookingAtomic(): snapshot-isolated overlap check
//                        + insert + car-guard write, with automatic retry
//   3. unique index    — partial unique index on Booking as the DB backstop
export const createBookingWithDetails = async (req: Request, res: Response) => {
  let lockKey = null; // set only if THIS request holds the lock

  try {
    const { _id } = req.user!;
    const {
      car,
      pickupDate,
      returnDate,
      userDetails,
      pickupDetails,
      returnDetails,
      extras,
      notes,
    } = req.body;

    if (!_id) {
      return res.status(401).json({
        success: false,
        message: "User must be logged in to create a booking",
      });
    }

    const dateError = validateBookingDates(pickupDate, returnDate);
    if (dateError) {
      return res.status(400).json({ success: false, message: dateError });
    }

    // Friendly fast-path: this same user already booked this exact car + dates.
    const existingBooking = await Booking.findOne({
      user: _id,
      car,
      status: { $in: ACTIVE_BOOKING_STATUSES },
      pickupDate: new Date(pickupDate),
      returnDate: new Date(returnDate),
    });
    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: "You already have a booking for this car and dates",
      });
    }

    // Layer 1 — in-memory lock. Fast-fail an identical request that is already
    // mid-flight on this instance. Not the real guarantee (see layer 2).
    lockKey = generateLockKey(car, pickupDate, returnDate);
    if (isLocked(lockKey)) {
      lockKey = null; // someone else's lock — don't release it in `finally`
      return res.status(409).json({
        success: false,
        message: "This booking is already being processed. Please try again in a moment.",
      });
    }
    acquireLock(lockKey);

    // Layer 2 — atomic, transactional creation.
    const booking = await createBookingAtomic({
      car,
      user: _id,
      pickupDate,
      returnDate,
      status: "pending",
      userDetails,
      pickupDetails,
      returnDetails,
      extras: extras || { extraDriver: false },
      notes: notes || "",
    });

    notifyOwner(booking.owner, { type: "booking.created", bookingId: String(booking._id) });

    console.log(`[createBookingWithDetails] Booking created`, {
      bookingId: booking._id.toString(),
      userId: _id.toString(),
      carId: String(car),
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      bookingId: booking._id,
      message: "Booking created successfully",
    });
  } catch (error) {
    return handleBookingError(res, error, "createBookingWithDetails");
  } finally {
    if (lockKey) releaseLock(lockKey);
  }
};

// Get Booking by ID API
export const getBookingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { _id: userId, role } = req.user!;

    // Find booking and populate car and user data
    const booking = await Booking.findById(id).populate("car").populate("user", "-password");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Authorization check:
    // - User can access their own bookings
    // - Owner can access bookings for their cars
    const isBookingOwner = booking.user._id.toString() === userId.toString();
    const isCarOwner = role === "owner" && booking.owner.toString() === userId.toString();

    if (!isBookingOwner && !isCarOwner) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    res.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error(`[getBookingById] Error:`, {
      message: errMessage(error),
      name: errName(error),
      stack:
        process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({
      success: false,
      message: "Failed to retrieve booking.",
    });
  }
};

// Cancel Booking API
export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const { id: bookingId } = req.params;
    const { _id: userId } = req.user!;

    // Find booking and populate user data for authorization check
    const booking = await Booking.findById(bookingId).populate("user", "-password");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Authorization check: only booking owner can cancel
    if (booking.user._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. You can only cancel your own bookings.",
      });
    }

    // Store previous status for logging
    const previousStatus = booking.status;

    // Only allow cancellation for "pending" or "confirmed" statuses
    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    if (booking.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a completed booking",
      });
    }

    // Cancel the booking
    booking.status = "cancelled";
    // Only check what changed: the pickup-date rule ("not in the past") must not block
    // cancelling a booking whose pickup date has since passed.
    await booking.save({ validateModifiedOnly: true });
    notifyOwner(booking.owner, { type: "booking.cancelled", bookingId: String(booking._id) });

    console.log(`[cancelBooking] Booking cancelled successfully`, {
      bookingId: booking._id.toString(),
      userId: userId.toString(),
      previousStatus: previousStatus,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    console.error(`[cancelBooking] Error:`, {
      message: errMessage(error),
      name: errName(error),
      stack:
        process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({
      success: false,
      message: "Failed to cancel booking. Please try again.",
    });
  }
};

// Internal helpers exposed for tests only — not part of the HTTP API.
// Also used (read-only) by the assistant and MCP tools
export { checkAvailability };

export const __testables = {
  createBookingAtomic,
  createBookingNonTransactional,
  checkAvailability,
  BookingError,
  ACTIVE_BOOKING_STATUSES,
  overlapFilter,
  validateBookingDates,
  generateLockKey,
  isLocked,
  acquireLock,
  releaseLock,
  LOCK_TTL_MS,
};
