import mongoose, { type InferSchemaType, type HydratedDocument } from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

export const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed"] as const;
export const BOOKING_STATUSES = [...ACTIVE_BOOKING_STATUSES, "cancelled", "completed"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

const bookingSchema = new mongoose.Schema({
  car: { type: ObjectId, ref: "Car", required: true },
  user: { type: ObjectId, ref: "User", required: true },
  owner: { type: ObjectId, ref: "User", required: true },
  pickupDate: {
    type: Date,
    required: [true, "Pickup date is required"],
    validate: {
      validator: function (value: Date): boolean {
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
      validator: function (this: { pickupDate: Date }, value: Date): boolean {
        return value > this.pickupDate;
      },
      message: "Return date must be after pickup date"
    }
  },
  status: {
    type: String,
    enum: {
      values: [...BOOKING_STATUSES],
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
bookingSchema.index({ user: 1 });
bookingSchema.index({ owner: 1 });
bookingSchema.index({ status: 1 });
// Availability lookups filter by active status, so the partial unique index
// below (same key, filtered to pending/confirmed) also serves those reads.

// Database-enforced guard against double-booking.
// A car may have at most ONE active (pending/confirmed) booking for a given
// exact date range — regardless of which user creates it. The partial filter
// keeps cancelled/completed bookings from blocking a later re-book of the same
// dates. Overlapping (non-identical) ranges are handled in the booking
// transaction; this index is the atomic backstop for the exact-match case.
bookingSchema.index(
  { car: 1, pickupDate: 1, returnDate: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: [...ACTIVE_BOOKING_STATUSES] } },
  }
);

export type BookingAttrs = InferSchemaType<typeof bookingSchema>;
export type BookingDocument = HydratedDocument<BookingAttrs>;

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
