// Shared domain types for the client. These mirror the server's Mongoose
// models (server/models/*). Kept intentionally loose where the API response
// shape varies (populated vs. id-only references).

export type Id = string;

export interface User {
  _id: Id;
  name: string;
  email: string;
  role: "user" | "owner";
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Car {
  _id: Id;
  owner?: Id | User | null;
  brand: string;
  model: string;
  image: string;
  year: number;
  category: string;
  seating_capacity: number;
  fuel_type: string;
  transmission: string;
  pricePerDay: number;
  location: string;
  description: string;
  mpg?: number;
  trunk_capacity?: number;
  tags?: string[];
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface BookingUserDetails {
  fullName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  licenseCountry?: string;
}

export interface BookingLocationDetails {
  address?: string;
  time?: string;
}

export interface Booking {
  _id: Id;
  car: Car;
  user: Id | User;
  owner: Id | User;
  pickupDate: string;
  returnDate: string;
  status: BookingStatus;
  price: number;
  userDetails?: BookingUserDetails;
  pickupDetails?: BookingLocationDetails;
  returnDetails?: BookingLocationDetails;
  extras?: { extraDriver?: boolean };
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** A car augmented with an availability flag by the check-availability endpoint. */
export interface CarWithAvailability extends Car {
  isAvailable: boolean;
}

/** AI recommendation result item. */
export interface CarRecommendation extends Car {
  car_id: Id;
  score: number;
  similarityScore: number;
  boostScore: number;
  reason: string;
  rank: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

/** One month of the owner dashboard's revenue chart. */
export interface MonthlyRevenue {
  /** "2026-11" */
  month: string;
  /** "Nov" */
  label: string;
  revenue: number;
  bookings: number;
}
