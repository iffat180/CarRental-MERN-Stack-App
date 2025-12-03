import { body, param, validationResult } from "express-validator";
import mongoose from "mongoose";

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// Register User Validator
export const validateRegister = [
  body("name")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),
  body("email")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  handleValidationErrors,
];

// Login User Validator
export const validateLogin = [
  body("email")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  handleValidationErrors,
];

// Validate MongoDB ObjectId (reusable)
export const validateObjectId = (fieldName) => [
  body(fieldName)
    .notEmpty()
    .withMessage(`${fieldName} is required`)
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error(`Invalid ${fieldName} format`);
      }
      return true;
    }),
  handleValidationErrors,
];

// Validate Date Range
export const validateDateRange = [
  body("pickupDate")
    .notEmpty()
    .withMessage("Pickup date is required")
    .isISO8601()
    .withMessage("Pickup date must be a valid ISO 8601 date"),
  body("returnDate")
    .notEmpty()
    .withMessage("Return date is required")
    .isISO8601()
    .withMessage("Return date must be a valid ISO 8601 date"),
  handleValidationErrors,
];

// Validate Check Availability
export const validateCheckAvailability = [
  body("location")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Location is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Location must be between 2 and 100 characters"),
  ...validateDateRange,
];

// Validate Create Booking
export const validateCreateBooking = [
  ...validateObjectId("car"),
  ...validateDateRange,
];

// Validate Change Booking Status
export const validateChangeBookingStatus = [
  param("id")
    .notEmpty()
    .withMessage("Booking ID is required")
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid booking ID format");
      }
      return true;
    }),
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["pending", "confirmed", "cancelled", "completed"])
    .withMessage("Status must be one of: pending, confirmed, cancelled, completed"),
  handleValidationErrors,
];

// Validate Car Data (simplified)
export const validateCarData = [
  body("carData")
    .notEmpty()
    .withMessage("Car data is required")
    .custom((value) => {
      try {
        const car = JSON.parse(value);
        
        // Protect against prototype pollution
        if (car && typeof car === 'object' && !Array.isArray(car)) {
          if (car.constructor && car.constructor.name !== 'Object') {
            throw new Error("Invalid car data structure");
          }
          if (Object.prototype.hasOwnProperty.call(car, '__proto__') || 
              Object.prototype.hasOwnProperty.call(car, 'constructor') ||
              Object.prototype.hasOwnProperty.call(car, 'prototype')) {
            throw new Error("Invalid car data: prototype pollution detected");
          }
        }
        
        if (!car.brand || typeof car.brand !== "string") {
          throw new Error("Brand is required and must be a string");
        }
        if (!car.model || typeof car.model !== "string") {
          throw new Error("Model is required and must be a string");
        }
        if (!car.pricePerDay || typeof car.pricePerDay !== "number") {
          throw new Error("Price per day is required and must be a number");
        }
        return true;
      } catch (error) {
        if (error.message.startsWith("Unexpected token") || error.message.startsWith("Unexpected end")) {
          throw new Error("Invalid JSON format in carData");
        }
        throw error;
      }
    }),
  handleValidationErrors,
];

// Validate Newsletter Subscription
export const validateNewsletter = [
  body("email")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  handleValidationErrors,
];

// Validate Time Range (8:00 AM to 10:00 PM)
const validateTimeRange = (value) => {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new Error("Time must be in HH:MM format");
  }
  const [hours, minutes] = value.split(":").map(Number);
  const hourInMinutes = hours * 60 + minutes;
  const minTime = 8 * 60; // 8:00 AM = 480 minutes
  const maxTime = 22 * 60; // 10:00 PM = 1320 minutes
  
  if (hourInMinutes < minTime || hourInMinutes > maxTime) {
    throw new Error("Time must be between 08:00 and 22:00");
  }
  return true;
};

// Validate Create Booking Details
export const validateCreateBookingDetails = [
  // Validate car ObjectId and date range (reuse existing validators)
  ...validateObjectId("car"),
  ...validateDateRange,
  
  // Validate userDetails nested object (all required)
  body("userDetails.fullName")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Full name is required")
    .isString()
    .withMessage("Full name must be a string"),
  body("userDetails.email")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("userDetails.phone")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Phone number is required")
    .isString()
    .withMessage("Phone number must be a string"),
  body("userDetails.dateOfBirth")
    .notEmpty()
    .withMessage("Date of birth is required")
    .isISO8601()
    .withMessage("Date of birth must be a valid ISO 8601 date"),
  body("userDetails.nationality")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Nationality is required")
    .isString()
    .withMessage("Nationality must be a string"),
  body("userDetails.licenseNumber")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("License number is required")
    .isString()
    .withMessage("License number must be a string"),
  body("userDetails.licenseExpiry")
    .notEmpty()
    .withMessage("License expiry date is required")
    .isISO8601()
    .withMessage("License expiry date must be a valid ISO 8601 date")
    .custom((value) => {
      const expiryDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiryDate <= today) {
        throw new Error("License expiry date must be in the future");
      }
      return true;
    }),
  body("userDetails.licenseCountry")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("License country is required")
    .isString()
    .withMessage("License country must be a string"),
  
  // Validate pickupDetails nested object (all required)
  body("pickupDetails.address")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Pickup address is required")
    .isString()
    .withMessage("Pickup address must be a string"),
  body("pickupDetails.time")
    .trim()
    .notEmpty()
    .withMessage("Pickup time is required")
    .isString()
    .withMessage("Pickup time must be a string")
    .matches(/^\d{2}:\d{2}$/)
    .withMessage("Pickup time must be in HH:MM format")
    .custom(validateTimeRange),
  
  // Validate returnDetails nested object (all required)
  body("returnDetails.address")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Return address is required")
    .isString()
    .withMessage("Return address must be a string"),
  body("returnDetails.time")
    .trim()
    .notEmpty()
    .withMessage("Return time is required")
    .isString()
    .withMessage("Return time must be a string")
    .matches(/^\d{2}:\d{2}$/)
    .withMessage("Return time must be in HH:MM format")
    .custom(validateTimeRange),
  
  // Validate extras nested object (optional)
  body("extras.extraDriver")
    .optional()
    .isBoolean()
    .withMessage("Extra driver must be a boolean"),
  
  // Validate notes (optional)
  body("notes")
    .optional()
    .isString()
    .withMessage("Notes must be a string"),
  
  handleValidationErrors,
];

