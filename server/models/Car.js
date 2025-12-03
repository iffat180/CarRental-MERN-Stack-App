import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types

const carSchema = new mongoose.Schema({
    owner: { type: ObjectId, ref: 'User' },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    image: { type: String, required: true },
    year: {
        type: Number,
        required: [true, "Year is required"],
        min: [1900, "Year must be at least 1900"],
        max: [new Date().getFullYear() + 1, "Year cannot exceed current year + 1"]
    },
    category: {
        type: String,
        required: [true, "Category is required"],
        enum: {
            values: ['Sedan', 'SUV', 'Van', 'Sports Car', 'Convertible', 'Coupe', 'Hatchback', 'Wagon', 'Minivan', 'Pickup Truck', 'Truck', 'SUV', 'Van'],
            message: "Category must be one of: Sedan, SUV, Van, Sports Car, Convertible, Coupe, Hatchback, Wagon, Minivan, Pickup Truck, Truck, SUV, Van"
        }
    },
    seating_capacity: {
        type: Number,
        required: [true, "Seating capacity is required"],
        min: [1, "Seating capacity must be at least 1"],
        max: [20, "Seating capacity cannot exceed 20"]
    },
    fuel_type: {
        type: String,
        required: [true, "Fuel type is required"],
        enum: {
            values: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Gas'],
            message: "Fuel type must be one of: Petrol, Diesel, Electric, Hybrid, Gas"
        }
    },
    transmission: {
        type: String,
        required: [true, "Transmission is required"],
        enum: {
            values: ['Automatic', 'Manual', 'Semi-Automatic'],
            message: "Transmission must be one of: Automatic, Manual, Semi-Automatic"
        }
    },
    pricePerDay: {
        type: Number,
        required: [true, "Price per day is required"],
        min: [1, "Price per day must be at least 1"]
    },
    location: {
        type: String,
        required: [true, "Location is required"],
        trim: true
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        trim: true
    },
    mpg: {
        type: Number,
        min: [0, "MPG must be a positive number"]
    },
    trunk_capacity: {
        type: Number,
        min: [1, "Trunk capacity must be at least 1"]
    },
    tags: {
        type: [String],
        default: []
    },
    isAvailable: { type: Boolean, default: true }
}, {timestamps: true})

// Add indexes for better query performance
carSchema.index({ owner: 1 });
carSchema.index({ location: 1 });
carSchema.index({ isAvailable: 1 });

const Car = mongoose.model('Car', carSchema)

export default Car