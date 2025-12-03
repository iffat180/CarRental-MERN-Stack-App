import User from "../models/User.js";
import bcrypt from "bcrypt";
import e from "express";
import jwt from "jsonwebtoken";
import Car from "../models/Car.js";

//Generate JWT Token
const generateToken = (userId, role) => {
  const payload = {
    userId: userId,
    role: role
  };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d' // 7 days expiration
  });
};

//Register User
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password || password.length < 8) {
      return res.status(400).json({ success: false, message: "Fill all the fields" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    const token = generateToken(user._id.toString(), user.role);
    res.json({ success: true, token });
  } catch (error) {
    console.error(`[registerUser] Error:`, {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ success: false, message: "Registration failed. Please try again." });
  }
};

//Login User
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const token = generateToken(user._id.toString(), user.role);
    res.json({ success: true, token });
  } catch (error) {
    console.error(`[loginUser] Error:`, {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({ success: false, message: "Login failed. Please try again." });
  }
};


//Get User Data using JWT
export const getUserData = async (req, res) => {
  try {
    const { user } = req;
    res.json ({ success: true, user })
  } catch (error) {
    console.error(`[getUserData] Error:`, {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ success: false, message: "Failed to retrieve user data." });
  }
};

// Upgrade User to Owner
export const upgradeToOwner = async (req, res) => {
  try {
    const { user } = req; // User is attached by protect middleware
    
    // Check if user is already an owner
    if (user.role === "owner") {
      const updatedUser = await User.findById(user._id).select("-password");
      return res.status(200).json({ 
        success: true, 
        message: "You are already an owner",
        user: updatedUser
      });
    }
    
    // Upgrade user to owner
    user.role = "owner";
    await user.save();
    
    // Return updated user (without password)
    const updatedUser = await User.findById(user._id).select("-password");
    
    res.status(200).json({
      success: true,
      message: "You are now an owner",
      user: updatedUser
    });
  } catch (error) {
    console.error(`[upgradeToOwner] Error:`, {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      success: false, 
      message: "Failed to upgrade to owner. Please try again." 
    });
  }
};

// Get All Cars for the Frontend
export const getCars = async (req, res) => {
    try {
        // Fetch all cars that are marked as available from the database
        const cars = await Car.find({ isAvailable: true });

        // Send success response with the list of cars
        res.json({ success: true, cars });
    } catch (error) {
        console.error(`[getCars] Error:`, {
          message: error.message,
          name: error.name,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
        res.status(500).json({ success: false, message: "Failed to retrieve cars." });
    }
}

// Get Single Car by ID
export const getCarById = async (req, res) => {
    try {
        const { id } = req.params;

        // Find car by ID
        const car = await Car.findById(id);

        if (!car) {
            return res.status(404).json({
                success: false,
                message: "Car not found"
            });
        }

        res.json({ success: true, car });
    } catch (error) {
        console.error(`[getCarById] Error:`, {
          message: error.message,
          name: error.name,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
        res.status(500).json({ success: false, message: "Failed to retrieve car." });
    }
}

// Get Available Cities
export const getCities = async (req, res) => {
    try {
        // Fetch distinct location values from cars that are available
        const cities = await Car.distinct("location", { isAvailable: true });
        
        // Sort cities alphabetically
        const sortedCities = cities.sort();
        
        res.json({ success: true, cities: sortedCities });
    } catch (error) {
        console.error(`[getCities] Error:`, {
          message: error.message,
          name: error.name,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
        res.status(500).json({ success: false, message: "Failed to retrieve cities." });
    }
}

// Newsletter Subscription (Simple in-memory storage for now)
// In production, this should be stored in a database
const newsletterSubscribers = [];

// Subscribe to Newsletter
export const subscribeNewsletter = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        // Check if email already subscribed
        if (newsletterSubscribers.includes(email.toLowerCase())) {
            return res.status(400).json({ success: false, message: "Email already subscribed" });
        }

        // Add email to subscribers list
        newsletterSubscribers.push(email.toLowerCase());

        res.json({ 
            success: true, 
            message: "Successfully subscribed to newsletter!" 
        });
    } catch (error) {
        console.error(`[subscribeNewsletter] Error:`, {
          message: error.message,
          name: error.name,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
        res.status(500).json({ success: false, message: "Failed to subscribe. Please try again." });
    }
}
