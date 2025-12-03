import User from "../models/User.js";
import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Car from "../models/Car.js";
import Booking from "../models/Booking.js";

export const changeRoleToOwner = async (req, res) => {
  try {
    const { _id } = req.user; // Get user ID from the request
    const updatedUser = await User.findByIdAndUpdate(_id, { role: "owner" }, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, message: "User role updated to owner" });
  } catch (error) {
    console.error(`[changeRoleToOwner] Error:`, {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ success: false, message: "Failed to update user role." });
  }
};

//API to list cars

export const addCar = async (req, res) => {
  try {
    // Log incoming request for debugging
    console.log(`[addCar] Request received`, {
      userId: req.user?._id?.toString(),
      hasFile: !!req.file,
      hasCarData: !!req.body?.carData,
      reqBody: req.body, // Full request body
      bodyKeys: Object.keys(req.body || {}),
      fileInfo: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        hasBuffer: !!req.file.buffer,
        hasPath: !!req.file.path
      } : null,
      timestamp: new Date().toISOString()
    });

    const { _id } = req.user; // Get user ID from the request
    
    // Parse carData with prototype pollution protection
    let car;
    try {
      car = JSON.parse(req.body.carData);
      // Protect against prototype pollution
      if (car && typeof car === 'object' && !Array.isArray(car)) {
        if (car.constructor && car.constructor.name !== 'Object') {
          return res.status(400).json({
            success: false,
            message: "Invalid car data structure"
          });
        }
        if (Object.prototype.hasOwnProperty.call(car, '__proto__') || 
            Object.prototype.hasOwnProperty.call(car, 'constructor') ||
            Object.prototype.hasOwnProperty.call(car, 'prototype')) {
          return res.status(400).json({
            success: false,
            message: "Invalid car data: prototype pollution detected"
          });
        }
      }
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format in carData"
      });
    }
    
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ success: false, message: "Image file is required" });
    }

    // Validate car data against model schema
    const validationErrors = [];

    // Validate year (1900 to currentYear + 1)
    if (!car.year || typeof car.year !== 'number' || car.year < 1900 || car.year > new Date().getFullYear() + 1) {
      validationErrors.push("Year must be a number between 1900 and " + (new Date().getFullYear() + 1));
    }

    // Validate category enum
    const validCategories = ['Sedan', 'SUV', 'Van'];
    if (!car.category || !validCategories.includes(car.category)) {
      validationErrors.push(`Category must be one of: ${validCategories.join(', ')}`);
    }

    // Validate fuel_type enum
    const validFuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Gas'];
    if (!car.fuel_type || !validFuelTypes.includes(car.fuel_type)) {
      validationErrors.push(`Fuel type must be one of: ${validFuelTypes.join(', ')}`);
    }

    // Validate transmission enum
    const validTransmissions = ['Automatic', 'Manual', 'Semi-Automatic'];
    if (!car.transmission || !validTransmissions.includes(car.transmission)) {
      validationErrors.push(`Transmission must be one of: ${validTransmissions.join(', ')}`);
    }

    // Validate seating_capacity (1-20)
    if (!car.seating_capacity || typeof car.seating_capacity !== 'number' || car.seating_capacity < 1 || car.seating_capacity > 20) {
      validationErrors.push("Seating capacity must be a number between 1 and 20");
    }

    // Validate pricePerDay (min 1)
    if (!car.pricePerDay || typeof car.pricePerDay !== 'number' || car.pricePerDay < 1) {
      validationErrors.push("Price per day must be a number greater than 0");
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors
      });
    }

    //upload image to ImageKit
    // Use buffer directly from memory storage (multer memoryStorage)
    // Primary: use buffer from memory storage
    // Fallback: only if buffer missing AND path exists (disk storage)
    let fileBuffer = imageFile.buffer;
    
    if (!fileBuffer && imageFile.path) {
      try {
        fileBuffer = fs.readFileSync(imageFile.path);
      } catch (pathError) {
        console.error(`[addCar] Failed to read file from path`, {
          userId: _id?.toString(),
          path: imageFile.path,
          error: pathError.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    if (!fileBuffer) {
      console.error(`[addCar] No file buffer available`, {
        userId: _id?.toString(),
        fileInfo: {
          originalname: imageFile.originalname,
          mimetype: imageFile.mimetype,
          size: imageFile.size,
          hasBuffer: !!imageFile.buffer,
          hasPath: !!imageFile.path
        },
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({ 
        success: false, 
        message: "Image file data is missing" 
      });
    }

    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: imageFile.originalname,
      folder: "/cars",
    });

    /// optimization through imagekit URL transformation
    var optimizedImageUrl = imagekit.url({
      path: response.filePath,
      transformation: [
        { width: "1280" }, // Width resizing
        { quality: "auto" }, // Auto compression
        { format: "webp" }, // Convert to modern format
      ],
    });

    const image = optimizedImageUrl;
    await Car.create({ ...car, owner: _id, image }); // Save car data to the database

    res.json({ success: true, message: "Car added successfully" });
  } catch (error) {
    console.error(`[addCar] Error:`, {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      userId: req.user?._id?.toString(),
      hasFile: !!req.file,
      hasCarData: !!req.body?.carData,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to add car. Please try again." 
    });
  }
};

//API to get all cars of a specific owner
export const getOwnerCars = async (req, res) => {
  try {
    const { _id } = req.user;
    const cars = await Car.find({ owner: _id });
    res.json({ success: true, cars });
  } catch (error) {
    console.error(`[getOwnerCars] Error:`, {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ success: false, message: "Failed to retrieve cars." });
  }
};

// API to Toggle Car Availability
export const toggleCarAvailability = async (req, res) => {
  try {
    const { _id } = req.user;
    const { carId } = req.body;
    const car = await Car.findById(carId);

    if (!car) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }

    // Checking if the car belongs to the user
    if (car.owner.toString() !== _id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    car.isAvailable = !car.isAvailable;
    await car.save();

    res.json({ success: true, message: "Availability Toggled" });
  } catch (error) {
    console.error(`[toggleCarAvailability] Error:`, {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ success: false, message: "Failed to update car availability." });
  }
};

// API to delete a car
export const deleteCar = async (req, res) => {
  try {
    const { _id } = req.user;
    const { carId } = req.body;
    const car = await Car.findById(carId);

    if (!car) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }

    // Checking if the car belongs to the user
    if (car.owner.toString() !== _id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    car.owner = null; // Remove owner reference
    car.isAvailable = false; // Set availability to false
    await car.save();

    res.json({ success: true, message: "Car Removed" });
  } catch (error) {
    console.error(`[deleteCar] Error:`, {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ success: false, message: "Failed to delete car." });
  }
};

// API to get Dashboard Data
export const getDashboardData = async (req, res) => {
  try {
    const { _id, role } = req.user;

    if (role !== "owner") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const cars = await Car.find({ owner: _id });
    const bookings = await Booking.find({ owner: _id })
      .populate("car")
      .sort({ createdAt: -1 });

    const pendingBookings = await Booking.find({
      owner: _id,
      status: "pending",
    });
    const completedBookings = await Booking.find({
      owner: _id,
      status: "completed",
    });

    // Calculate monthlyRevenue from bookings where status is confirmed
    const monthlyRevenue = bookings
      .slice()
      .filter((booking) => booking.status === "confirmed")
      .reduce((acc, booking) => acc + booking.price, 0);

    const dashboardData = {
      totalCars: cars.length,
      totalBookings: bookings.length,
      pendingBookings: pendingBookings.length,
      completedBookings: completedBookings.length,
      recentBookings: bookings.slice(0, 3),
      monthlyRevenue,
    };

    res.json({ success: true, dashboardData });
  } catch (error) {
    console.error(`[getDashboardData] Error:`, {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ success: false, message: "Failed to retrieve dashboard data." });
  }
};

//Api to update user image
export const updateUserImage = async (req, res) => {
  try {
    const { _id } = req.user;

    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ success: false, message: "Image file is required" });
    }

    //upload image to ImageKit
    // Use buffer directly from memory storage (multer memoryStorage)
    // Primary: use buffer from memory storage
    // Fallback: only if buffer missing AND path exists (disk storage)
    let fileBuffer = imageFile.buffer;
    
    if (!fileBuffer && imageFile.path) {
      try {
        fileBuffer = fs.readFileSync(imageFile.path);
      } catch (pathError) {
        console.error(`[updateUserImage] Failed to read file from path`, {
          userId: _id?.toString(),
          path: imageFile.path,
          error: pathError.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    if (!fileBuffer) {
      console.error(`[updateUserImage] No file buffer available`, {
        userId: _id?.toString(),
        fileInfo: {
          originalname: imageFile.originalname,
          mimetype: imageFile.mimetype,
          size: imageFile.size,
          hasBuffer: !!imageFile.buffer,
          hasPath: !!imageFile.path
        },
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({ 
        success: false, 
        message: "Image file data is missing" 
      });
    }

    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: imageFile.originalname,
      folder: "/users",
    });

    /// optimization through imagekit URL transformation
    var optimizedImageUrl = imagekit.url({
      path: response.filePath,
      transformation: [
        { width: "400" }, // Width resizing
        { quality: "auto" }, // Auto compression
        { format: "webp" }, // Convert to modern format
      ],
    });

    const image = optimizedImageUrl;

    await User.findByIdAndUpdate(_id, { image });
    res.json({ success: true, message: "User image updated successfully" });
  } catch (error) {
    console.error(`[updateUserImage] Error:`, {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ success: false, message: "Failed to update user image." });
  }
};
