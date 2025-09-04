import User from "../models/User.js";
import bcrypt from "bcrypt";
import e from "express";
import jwt from "jsonwebtoken";
import Car from "../models/Car.js";

//Generate JWT Token
const generateToken = (userId) => {
  const payload = userId;
  return jwt.sign(payload, process.env.JWT_SECRET);
};

//Register User
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password || password.length < 8) {
      return res.json({ success: false, message: "Fill all the fields" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    const token = generateToken(user._id.toString());
    res.json({ success: true, token });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

//Login User
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }
    const token = generateToken(user._id.toString());
    res.json({ success: true, token });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};


//Get User Data using JWT
export const getUserData = async (req, res) => {
  try {
    const { user } = req;
    res.json ({ success: true, user })
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
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
        // Log the error message for debugging
        console.log(error.message);

        // Send failure response with the error message
        res.json({ success: false, message: error.message });
    }
}
