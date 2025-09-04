import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";
import Car from "../models/Car.js";

// your 11 local images
const IMAGES = [
  "/uploads/car1.jpg",
  "/uploads/car2.jpg",
  "/uploads/car3.jpg",
  "/uploads/car4.jpg",
  "/uploads/car5.jpg",
  "/uploads/car6.jpg",
  "/uploads/car7.jpg",
  "/uploads/car8.jpg",
  "/uploads/car9.jpg",
  "/uploads/car10.jpg",
  "/uploads/car11.jpg",
];

// make the 11 car objects (edit the details if you want)
const DESC = "Preloaded inventory vehicle from Platform Fleet."; // short shared description

const makeCars = (ownerId) => [
  {
    owner: ownerId,
    brand: "Nissan",
    model: "X5",
    year: 2022,
    category: "SUV",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 220,
    location: "New York",
    image: IMAGES[0],
    description: DESC,
    isAvailable: true,
    source: "seed",
  },

  {
    owner: ownerId,
    brand: "Jeep",
    model: "Corolla",
    year: 2021,
    category: "Sedan",
    seating_capacity: 5,
    fuel_type: "Diesel",
    transmission: "Manual",
    pricePerDay: 130,
    location: "Chicago",
    image: IMAGES[1],
    description: DESC,
    isAvailable: true,
    source: "seed",
  },

  {
    owner: ownerId,
    brand: "Range Rover",
    model: "Wrangler",
    year: 2023,
    category: "SUV",
    seating_capacity: 4,
    fuel_type: "Hybrid",
    transmission: "Automatic",
    pricePerDay: 200,
    location: "Los Angeles",
    image: IMAGES[2],
    description: DESC,
    isAvailable: true,
    source: "seed",
  },

  {
    owner: ownerId,
    brand: "BMW",
    model: "Neo 6",
    year: 2022,
    category: "Sedan",
    seating_capacity: 4,
    fuel_type: "Diesel",
    transmission: "Semi-Automatic",
    pricePerDay: 150,
    location: "Houston",
    image: IMAGES[3],
    description: DESC,
    isAvailable: true,
    source: "seed",
  },

  {
    owner: ownerId,
    brand: "Audi",
    model: "Civic",
    year: 2020,
    category: "Sedan",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 120,
    location: "Seattle",
    image: IMAGES[4],
    description: DESC,
    isAvailable: true,
    source: "seed",
  },

  {
    owner: ownerId,
    brand: "Mercedes",
    model: "Q5",
    year: 2021,
    category: "SUV",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 210,
    location: "Boston",
    image: IMAGES[5],
    description: DESC,
    isAvailable: true,
    source: "seed",
  },

  {
    owner: ownerId,
    brand: "BMW",
    model: "Elantra",
    year: 2019,
    category: "Sedan",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 95,
    location: "Miami",
    image: IMAGES[6],
    description: DESC,
    isAvailable: true,
    source: "seed",
  },

  {
    owner: ownerId,
    brand: "BMW",
    model: "Sportage",
    year: 2022,
    category: "SUV",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 140,
    location: "Dallas",
    image: IMAGES[7],
    description: DESC,
    isAvailable: true,
    source: "seed",
  },

  {
    owner: ownerId,
    brand: "Tesla",
    model: "Altima",
    year: 2021,
    category: "Sedan",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 110,
    location: "Denver",
    image: IMAGES[8],
    description: DESC,
    isAvailable: true,
    source: "seed",
  },

  {
    owner: ownerId,
    brand: "Ford",
    model: "Model 3",
    year: 2023,
    category: "Sedan",
    seating_capacity: 5,
    fuel_type: "Electric",
    transmission: "Automatic",
    pricePerDay: 180,
    location: "San Francisco",
    image: IMAGES[9],
    description: DESC,
    isAvailable: true,
    source: "seed",
  },

  {
    owner: ownerId,
    brand: "Chevrolet",
    model: "CX-5",
    year: 2020,
    category: "SUV",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 135,
    location: "Atlanta",
    image: IMAGES[10],
    description: DESC,
    isAvailable: true,
    source: "seed",
  },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");

    // Make or reuse a special owner for preloaded cars
    const platformEmail = "fleet@yourapp.com";
    const hashed = await bcrypt.hash("qwerty123", 10);

    const platformUser = await User.findOneAndUpdate(
      { email: platformEmail },
      {
        name: "Platform Fleet",
        email: platformEmail,
        role: "owner",
        isSystem: true,
        password: "hashed",
      },
      { new: true, upsert: true }
    );
    console.log("✅ Platform user:", platformUser._id.toString());

    // Clear only previously seeded cars, keep user-listed cars
    await Car.deleteMany({ source: "seed" });

    // Insert your 11 cars
    const cars = makeCars(platformUser._id);
    await Car.insertMany(cars);
    console.log(`✅ Seeded ${cars.length} cars`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  }
})();
