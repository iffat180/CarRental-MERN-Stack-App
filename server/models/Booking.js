import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

const bookingSchema = new mongoose.Schema({
  car: { type: ObjectId, ref: "Car", required: true },
  user: { type: ObjectId, ref: "User", required: true },
  owner: { type: ObjectId, ref: "User", required: true },
  pickupDate: {
    type: Date,
    required: [true, "Pickup date is required"],
    validate: {
      validator: function(value) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return value >= today;
      },
      message: "Pickup date cannot be in the past"
    }
  },
  returnDate: {
    type: Date,
    required: [true, "Return date is required"],
    validate: {
      validator: function(value) {
        return value > this.pickupDate;
      },
      message: "Return date must be after pickup date"
    }
  },
  status: {
    type: String,
    enum: {
      values: ["pending", "confirmed", "cancelled", "completed"],
      message: "Status must be one of: pending, confirmed, cancelled, completed"
    },
    default: "pending"
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"]
  },
  userDetails: {
    fullName: { type: String },
    email: { type: String },
    phone: { type: String },
    dateOfBirth: { type: Date },
    nationality: { type: String },
    licenseNumber: { type: String },
    licenseExpiry: { type: Date },
    licenseCountry: { type: String }
  },
  pickupDetails: {
    address: { type: String },
    time: { type: String }
  },
  returnDetails: {
    address: { type: String },
    time: { type: String }
  },
  extras: {
    extraDriver: { type: Boolean, default: false }
  },
  notes: { type: String }
}, { timestamps: true });

// Add indexes for better query performance
bookingSchema.index({ car: 1, pickupDate: 1, returnDate: 1 });
bookingSchema.index({ user: 1 });
bookingSchema.index({ owner: 1 });
bookingSchema.index({ status: 1 });

// Unique compound index to prevent duplicate bookings at DB level
// Atomic constraint: same user cannot book same car for same date range
bookingSchema.index({ user: 1, car: 1, pickupDate: 1, returnDate: 1 }, { unique: true });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
