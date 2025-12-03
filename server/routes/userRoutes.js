/**
 * User Routes
 * Handles user authentication and public car browsing
 */

import express from "express";
import { getCarById, getCars, getCities, getUserData, loginUser, registerUser, subscribeNewsletter, upgradeToOwner } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
import { strictLimiter, userLimiter } from "../middleware/rateLimiters.js";
import { validateRegister, validateLogin, validateNewsletter } from "../middleware/validators.js";

const userRouter = express.Router();

// ============================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================

/**
 * POST /api/user/register
 * Register a new user
 * Middleware: strictLimiter → validateRegister → registerUser
 */
userRouter.post('/register', strictLimiter, validateRegister, registerUser)

/**
 * POST /api/user/login
 * Authenticate user and return JWT token
 * Middleware: strictLimiter → validateLogin → loginUser
 */
userRouter.post('/login', strictLimiter, validateLogin, loginUser)

/**
 * GET /api/user/cars
 * Get all available cars (Public endpoint for browsing)
 * Middleware: userLimiter → getCars
 */
userRouter.get('/cars', userLimiter, getCars)

/**
 * GET /api/user/cars/:id
 * Get a single car by ID (Public endpoint for browsing)
 * Middleware: userLimiter → getCarById
 */
userRouter.get('/cars/:id', userLimiter, getCarById)

/**
 * GET /api/user/cities
 * Get all available cities from car locations (Public endpoint)
 * Middleware: userLimiter → getCities
 */
userRouter.get('/cities', userLimiter, getCities)

/**
 * POST /api/user/newsletter/subscribe
 * Subscribe to newsletter (Public endpoint)
 * Middleware: userLimiter → validateNewsletter → subscribeNewsletter
 */
userRouter.post('/newsletter/subscribe', userLimiter, validateNewsletter, subscribeNewsletter)

// ============================================
// PROTECTED ROUTES (Authentication Required)
// ============================================

/**
 * GET /api/user/data
 * Get authenticated user's data
 * Middleware: userLimiter → protect → getUserData
 */
userRouter.get('/data', userLimiter, protect, getUserData)

/**
 * POST /api/user/upgrade-to-owner
 * Upgrade authenticated user to owner role
 * Middleware: userLimiter → protect → upgradeToOwner
 */
userRouter.post('/upgrade-to-owner', userLimiter, protect, upgradeToOwner)

export default userRouter;
