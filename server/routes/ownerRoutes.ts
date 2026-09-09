/**
 * Owner Routes
 * All routes require authentication and owner role
 */

import express from "express";
import { protect } from "../middleware/auth.js";
import { requireOwner } from "../middleware/requireOwner.js";
import { addCar, changeRoleToOwner, deleteCar, getDashboardData, getOwnerCars, toggleCarAvailability, updateUserImage } from "../controllers/ownerController.js";
import upload from "../middleware/multer.js";
import { ownerLimiter } from "../middleware/rateLimiters.js";
import { validateCarData, validateObjectId } from "../middleware/validators.js";

const ownerRouter = express.Router();

// ============================================
// OWNER ROUTES (Authentication + Owner Role Required)
// ============================================

// --- Role Management ---

/**
 * POST /api/owner/change-role
 * Change user role to owner (legacy endpoint)
 * Middleware: ownerLimiter → protect → requireOwner → changeRoleToOwner
 */
ownerRouter.post("/change-role", ownerLimiter, protect, requireOwner, changeRoleToOwner)

// --- Car Management ---

/**
 * POST /api/owner/add-car
 * Add a new car to owner's inventory
 * Middleware: ownerLimiter → protect → requireOwner → upload → validateCarData → addCar
 */
ownerRouter.post("/add-car", ownerLimiter, protect, requireOwner, upload.single("image"), validateCarData, addCar);

/**
 * GET /api/owner/cars
 * Get all cars owned by authenticated owner
 * Middleware: ownerLimiter → protect → requireOwner → getOwnerCars
 */
ownerRouter.get("/cars", ownerLimiter, protect, requireOwner, getOwnerCars);

/**
 * POST /api/owner/toggle-cars
 * Toggle car availability status
 * Middleware: ownerLimiter → protect → requireOwner → validateObjectId → toggleCarAvailability
 */
ownerRouter.post("/toggle-cars", ownerLimiter, protect, requireOwner, validateObjectId("carId"), toggleCarAvailability)

/**
 * POST /api/owner/delete-car
 * Soft delete a car (removes owner reference)
 * Middleware: ownerLimiter → protect → requireOwner → validateObjectId → deleteCar
 */
ownerRouter.post("/delete-car", ownerLimiter, protect, requireOwner, validateObjectId("carId"), deleteCar);

// --- Dashboard & Profile ---

/**
 * GET /api/owner/dashboard
 * Get owner dashboard data (stats, bookings, revenue)
 * Middleware: ownerLimiter → protect → requireOwner → getDashboardData
 */
ownerRouter.get("/dashboard", ownerLimiter, protect, requireOwner, getDashboardData);

/**
 * POST /api/owner/update-image
 * Update owner's profile image
 * Middleware: ownerLimiter → protect → requireOwner → upload → updateUserImage
 */
ownerRouter.post("/update-image", ownerLimiter, protect, requireOwner, upload.single("image"), updateUserImage)

export default ownerRouter;
