import Booking from "../models/Booking.js"  
import Car from "../models/Car.js";
import mongoose from "mongoose";

// ============================================
// IN-MEMORY AVAILABILITY LOCK MAP
// ============================================
// Lock format: Map<lockKey, { expiresAt: timestamp, createdAt: timestamp }>
// lockKey: `${carId}_${pickupDateISO}_${returnDateISO}`
// TTL: 30 seconds (prevents race conditions during booking creation)
// RISK: In-memory map resets on server restart - locks will be lost, but this is acceptable
//       as TTL expiry (30s) is short enough that restart impact is minimal
const availabilityLockMap = new Map();
const LOCK_TTL_MS = 30000; // 30 seconds (exactly as specified)

// Helper: Generate lock key from car ID and date range
const generateLockKey = (carId, pickupDate, returnDate) => {
  const pickupISO = new Date(pickupDate).toISOString();
  const returnISO = new Date(returnDate).toISOString();
  return `${carId}_${pickupISO}_${returnISO}`;
};

// Helper: Check if lock exists and is still valid (not expired)
const isLocked = (lockKey) => {
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
      timestamp: new Date().toISOString()
    });
    return false;
  }
  
  return true; // Lock exists and is valid
};

// Helper: Acquire lock (set lock with TTL)
const acquireLock = (lockKey) => {
  const now = Date.now();
  const lock = {
    expiresAt: now + LOCK_TTL_MS,
    createdAt: now
  };
  availabilityLockMap.set(lockKey, lock);
  console.log(`[AvailabilityLock] Lock acquired`, {
    lockKey,
    expiresAt: new Date(lock.expiresAt).toISOString(),
    ttlSeconds: LOCK_TTL_MS / 1000,
    timestamp: new Date().toISOString()
  });
};

// Helper: Release lock
const releaseLock = (lockKey) => {
  if (availabilityLockMap.has(lockKey)) {
    availabilityLockMap.delete(lockKey);
    console.log(`[AvailabilityLock] Lock released`, {
      lockKey,
      timestamp: new Date().toISOString()
    });
  }
};

// Function to Check Availability of Car for a given Date
const checkAvailability = async (car, pickupDate, returnDate, session = null) => {
    const query = Booking.find({
        car,
        pickupDate: { $lte: returnDate },
        returnDate: { $gte: pickupDate },
    });
    
    if (session) {
        query.session(session);
    }
    
    const bookings = await query;
    return bookings.length === 0;
};

// API to Check Availability of Cars for the given Date and location
export const checkAvailabilityOfCar = async (req, res) => {
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
            message: "Pickup date cannot be in the past"
          });
        }

        // Validate returnDate is after pickupDate
        if (returnD <= pickup) {
          return res.status(400).json({
            success: false,
            message: "Return date must be after pickup date"
          });
        }

        // fetch all available cars for the given location
        const cars = await Car.find({ location, isAvailable: true });

        // check car availability for the given date range using promise
        const availableCarsPromises = cars.map(async (car) => {
            const isAvailable = await checkAvailability(car._id, pickupDate, returnDate);
            return { ...car._doc, isAvailable };
        });

        let availableCars = await Promise.all(availableCarsPromises);
        availableCars = availableCars.filter(car => car.isAvailable === true);

        res.json({ success: true, availableCars });

    } catch (error) {
        console.error(`[checkAvailabilityOfCar] Error:`, {
          message: error.message,
          name: error.name,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
        res.status(500).json({ success: false, message: "Failed to check car availability." });
    }
};

/// Create Booking API
export const createBooking = async (req, res) => {
  try {
    const { _id } = req.user;
    const { car, pickupDate, returnDate } = req.body;

    // Validate date business logic
    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validate pickupDate is not in the past
    if (pickup < today) {
      return res.status(400).json({
        success: false,
        message: "Pickup date cannot be in the past"
      });
    }

    // Validate returnDate is after pickupDate
    if (returnD <= pickup) {
      return res.status(400).json({
        success: false,
        message: "Return date must be after pickup date"
      });
    }

    // Start MongoDB transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check availability within transaction
      const isAvailable = await checkAvailability(car, pickupDate, returnDate, session);

      if (!isAvailable) {
        await session.abortTransaction();
        await session.endSession();
        return res
          .status(400)
          .json({ success: false, message: "Car not available" });
      }

      // Find car within transaction
      const carData = await Car.findById(car).session(session);

      if (!carData) {
        await session.abortTransaction();
        await session.endSession();
        return res.status(404).json({ success: false, message: "Car not found" });
      }

      const noOfDays = Math.ceil(
        (new Date(returnDate) - new Date(pickupDate)) /
          (1000 * 60 * 60 * 24)
      );

      const price = carData.pricePerDay * noOfDays;

      // Create booking within transaction
      await Booking.create([{
        car,
        owner: carData.owner,
        user: _id,
        pickupDate,
        returnDate,
        price,
      }], { session });

      // Commit transaction
      await session.commitTransaction();
      await session.endSession();

      res.json({
        success: true,
        message: "Booking Created",
      });
    } catch (transactionError) {
      // Rollback on error
      await session.abortTransaction();
      await session.endSession();
      throw transactionError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error(`[createBooking] Error:`, {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ success: false, message: "Failed to create booking. Please try again." });
  }
};


// API to List User Bookings
export const getUserBookings = async (req, res) => {
  try {
    const { _id } = req.user;
    const bookings = await Booking.find({ user: _id })
      .populate("car")
      .sort({ createdAt: -1 });
      res.json({ success: true, bookings });

  } catch (error) {
    console.error(`[getUserBookings] Error:`, {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ success: false, message: "Failed to retrieve bookings." });
  }
}

// API to get Owner Bookings
export const getOwnerBookings = async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    const bookings = await Booking.find({ owner: req.user._id })
      .populate('car user')
      .select("-user.password")
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    console.error(`[getOwnerBookings] Error:`, {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ success: false, message: "Failed to retrieve bookings." });
  }
}

// API to change booking status
export const changeBookingStatus = async (req, res) => {
    try {
        const { _id } = req.user;
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
        await booking.save();

        res.json({ success: true, message: "Status Updated" });
    } catch (error) {
        console.error(`[changeBookingStatus] Error:`, {
          message: error.message,
          name: error.name,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
        res.status(500).json({ success: false, message: "Failed to update booking status." });
    }
};

// Create Booking with Details API
export const createBookingWithDetails = async (req, res) => {
  let lockKey = null; // Track lock key for cleanup in error paths
  
  try {
    const { _id } = req.user;
    const { 
      car, 
      pickupDate, 
      returnDate,
      userDetails,
      pickupDetails,
      returnDetails,
      extras,
      notes
    } = req.body;

    // Validate user is logged in (req.user is set by protect middleware)
    if (!_id) {
      return res.status(401).json({
        success: false,
        message: "User must be logged in to create a booking"
      });
    }

    // ============================================
    // STEP 1: Check for duplicate booking
    // ============================================
    const existingBooking = await Booking.findOne({
      user: _id,
      car,
      pickupDate: new Date(pickupDate),
      returnDate: new Date(returnDate)
    });

    if (existingBooking) {
      console.log(`[createBookingWithDetails] Duplicate rejected`, {
        userId: _id.toString(),
        carId: car.toString(),
        pickupDate: new Date(pickupDate).toISOString(),
        returnDate: new Date(returnDate).toISOString(),
        existingBookingId: existingBooking._id.toString(),
        timestamp: new Date().toISOString()
      });
      
      return res.status(400).json({
        success: false,
        message: "A booking with the same car and dates already exists"
      });
    }

    // ============================================
    // STEP 2: Check availability lock
    // ============================================
    const currentLockKey = generateLockKey(car, pickupDate, returnDate);
    
    if (isLocked(currentLockKey)) {
      console.log(`[createBookingWithDetails] Lock hit - Booking rejected`, {
        userId: _id.toString(),
        carId: car.toString(),
        lockKey: currentLockKey,
        pickupDate: new Date(pickupDate).toISOString(),
        returnDate: new Date(returnDate).toISOString(),
        timestamp: new Date().toISOString()
      });
      
      return res.status(409).json({
        success: false,
        message: "Booking is currently being processed. Please try again in a moment."
      });
    }

    // Lock miss - log and acquire lock
    console.log(`[createBookingWithDetails] Lock miss - Acquiring lock`, {
      userId: _id.toString(),
      carId: car.toString(),
      lockKey: currentLockKey,
      pickupDate: new Date(pickupDate).toISOString(),
      returnDate: new Date(returnDate).toISOString(),
      timestamp: new Date().toISOString()
    });
    
    acquireLock(currentLockKey);
    lockKey = currentLockKey; // Track for cleanup

    // ============================================
    // STEP 3: Check car availability (database check)
    // ============================================
    const isAvailable = await checkAvailability(car, pickupDate, returnDate);

    if (!isAvailable) {
      releaseLock(lockKey);
      return res.status(400).json({
        success: false,
        message: "Car not available for the selected dates"
      });
    }

    // ============================================
    // STEP 4: Find car data
    // ============================================
    const carData = await Car.findById(car);

    if (!carData) {
      releaseLock(lockKey);
      return res.status(404).json({
        success: false,
        message: "Car not found"
      });
    }

    // ============================================
    // STEP 5: Calculate price and create booking
    // ============================================
    const noOfDays = Math.ceil(
      (new Date(returnDate) - new Date(pickupDate)) /
        (1000 * 60 * 60 * 24)
    );

    const price = carData.pricePerDay * noOfDays;

    // Create booking with all details
    // Note: booking.user comes from req.user._id (logged-in user)
    // Note: booking.userDetails comes from req.body (form data)
    const booking = await Booking.create({
      car,
      user: _id,
      owner: carData.owner,
      pickupDate,
      returnDate,
      price,
      status: "pending",
      userDetails,
      pickupDetails,
      returnDetails,
      extras: extras || { extraDriver: false },
      notes: notes || ""
    });

    // Release lock after successful booking creation
    releaseLock(lockKey);

    // ============================================
    // STEP 6: Log successful booking creation
    // ============================================
    console.log(`[createBookingWithDetails] Booking created successfully`, {
      bookingId: booking._id.toString(),
      userId: _id.toString(),
      carId: car.toString(),
      ownerId: carData.owner.toString(),
      pickupDate: new Date(pickupDate).toISOString(),
      returnDate: new Date(returnDate).toISOString(),
      price,
      noOfDays,
      status: booking.status,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      bookingId: booking._id,
      message: "Booking created successfully"
    });

  } catch (error) {
    // Release lock on error
    if (lockKey) {
      releaseLock(lockKey);
    }
    
    // Handle duplicate key error (E11000) from unique index constraint
    if (error.code === 11000 || error.code === 11001) {
      console.log(`[createBookingWithDetails] Duplicate key error`, {
        userId: _id?.toString(),
        carId: car?.toString(),
        pickupDate: pickupDate ? new Date(pickupDate).toISOString() : null,
        returnDate: returnDate ? new Date(returnDate).toISOString() : null,
        errorCode: error.code,
        timestamp: new Date().toISOString()
      });
      
      return res.status(400).json({
        success: false,
        message: "A booking with the same car and dates already exists"
      });
    }
    
    console.error(`[createBookingWithDetails] Error:`, {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: "Failed to create booking. Please try again."
    });
  }
};

// Get Booking by ID API
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const { _id: userId, role } = req.user;

    // Find booking and populate car and user data
    const booking = await Booking.findById(id)
      .populate("car")
      .populate("user", "-password");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // Authorization check:
    // - User can access their own bookings
    // - Owner can access bookings for their cars
    const isBookingOwner = booking.user._id.toString() === userId.toString();
    const isCarOwner = role === 'owner' && booking.owner.toString() === userId.toString();

    if (!isBookingOwner && !isCarOwner) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    res.json({
      success: true,
      booking
    });

  } catch (error) {
    console.error(`[getBookingById] Error:`, {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: "Failed to retrieve booking."
    });
  }
};

// Cancel Booking API
export const cancelBooking = async (req, res) => {
  try {
    const { id: bookingId } = req.params;
    const { _id: userId } = req.user;

    // Find booking and populate user data for authorization check
    const booking = await Booking.findById(bookingId)
      .populate("user", "-password");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // Authorization check: only booking owner can cancel
    if (booking.user._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. You can only cancel your own bookings."
      });
    }

    // Store previous status for logging
    const previousStatus = booking.status;

    // Only allow cancellation for "pending" or "confirmed" statuses
    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled"
      });
    }

    if (booking.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a completed booking"
      });
    }

    // Cancel the booking
    booking.status = "cancelled";
    await booking.save();

    console.log(`[cancelBooking] Booking cancelled successfully`, {
      bookingId: booking._id.toString(),
      userId: userId.toString(),
      previousStatus: previousStatus,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: "Booking cancelled successfully"
    });

  } catch (error) {
    console.error(`[cancelBooking] Error:`, {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: "Failed to cancel booking. Please try again."
    });
  }
};
