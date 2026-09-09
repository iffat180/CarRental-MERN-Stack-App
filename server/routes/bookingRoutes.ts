/**
 * Booking Routes
 * Handles car availability checks, booking creation, and booking management
 */

import express from "express";
import { cancelBooking, changeBookingStatus, checkAvailabilityOfCar, createBooking,
    createBookingWithDetails, getBookingById, getOwnerBookings, getUserBookings } from "../controllers/bookingController.js";
import { protect } from "../middleware/auth.js";
import { requireOwner } from "../middleware/requireOwner.js";
import { userLimiter, ownerLimiter } from "../middleware/rateLimiters.js";
import { validateCheckAvailability, validateCreateBooking, validateCreateBookingDetails, validateChangeBookingStatus } from "../middleware/validators.js";

const bookingRouter = express.Router();

// ============================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================

/**
 * POST /api/bookings/check-availability
 * Check car availability for given dates and location (Public for browsing)
 * Middleware: userLimiter → validateCheckAvailability → checkAvailabilityOfCar
 */
bookingRouter.post('/check-availability', userLimiter, validateCheckAvailability, checkAvailabilityOfCar)

// ============================================
// PROTECTED ROUTES (Authentication Required)
// ============================================

/**
 * POST /api/bookings/create
 * Create a new booking
 * Middleware: userLimiter → validateCreateBooking → protect → createBooking
 */
bookingRouter.post('/create', userLimiter, validateCreateBooking, protect, createBooking)

/**
 * POST /api/bookings/create-details
 * Create a new booking with detailed renter information
 * Middleware: userLimiter → protect → validateCreateBookingDetails → createBookingWithDetails
 */
bookingRouter.post('/create-details', userLimiter, protect, validateCreateBookingDetails, createBookingWithDetails)

/**
 * GET /api/bookings/user
 * Get all bookings for authenticated user
 * Middleware: userLimiter → protect → getUserBookings
 */
bookingRouter.get('/user', userLimiter, protect, getUserBookings)

/**
 * POST /api/bookings/:id/cancel
 * Cancel a booking (only booking owner can cancel)
 * Middleware: userLimiter → protect → cancelBooking
 */
bookingRouter.post('/:id/cancel', userLimiter, protect, cancelBooking)

// ============================================
// OWNER ROUTES (Authentication + Owner Role Required)
// ============================================

/**
 * GET /api/bookings/owner
 * Get all bookings for authenticated owner
 * Middleware: ownerLimiter → protect → requireOwner → getOwnerBookings
 */
bookingRouter.get('/owner', ownerLimiter, protect, requireOwner, getOwnerBookings)

/**
 * POST /api/bookings/change-status/:id
 * Change booking status (pending/confirmed/cancelled)
 * Middleware: ownerLimiter → protect → requireOwner → validateChangeBookingStatus → changeBookingStatus
 */
bookingRouter.post('/change-status/:id', ownerLimiter, protect, requireOwner, validateChangeBookingStatus, changeBookingStatus)

// ============================================
// PROTECTED ROUTES - PARAMETERIZED (Must be last to avoid route conflicts)
// ============================================

/**
 * GET /api/bookings/:id
 * Get a single booking by ID (user can access own bookings, owner can access bookings for their cars)
 * Middleware: userLimiter → protect → getBookingById
 */
bookingRouter.get('/:id', userLimiter, protect, getBookingById)

export default bookingRouter;