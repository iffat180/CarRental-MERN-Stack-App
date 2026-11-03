import { z } from "zod";
import type { User } from "../types";

/**
 * The booking details form: its shape, its validation rules and its error
 * messages. The page uses this with React Hook Form (via zodResolver), so the
 * rules live in one place instead of an if-chain inside the component.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME = /^\d{2}:\d{2}$/;

const startOfToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * "2026-11-03" as local midnight. `new Date("2026-11-03")` would be midnight UTC,
 * which is still "yesterday" evening in the Americas, so a date picked as today
 * would count as past or future depending on the visitor's timezone.
 */
const parseLocalDate = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

/** A Date as "yyyy-mm-dd" in local time (toISOString would use UTC and can be a day off). */
export const toLocalISODate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** A "yyyy-mm-dd" date string strictly before today. */
export const isPastDate = (value: string): boolean =>
  !!value && parseLocalDate(value) < startOfToday();

/** A "yyyy-mm-dd" date string strictly after today. */
export const isFutureDate = (value: string): boolean =>
  !!value && parseLocalDate(value) > startOfToday();

const text = (message: string) => z.string().trim().min(1, message);

export const bookingDetailsSchema = z.object({
  userDetails: z.object({
    fullName: text("Full name is required"),
    email: z.string().refine((v) => EMAIL.test(v), "Valid email is required"),
    phone: text("Phone number is required"),
    dateOfBirth: z
      .string()
      .min(1, "Date of birth is required")
      .refine(isPastDate, "Date of birth must be in the past"),
    nationality: text("Nationality is required"),
    licenseNumber: text("License number is required"),
    licenseExpiry: z
      .string()
      .min(1, "License expiry date is required")
      .refine(isFutureDate, "License expiry date must be in the future"),
    licenseCountry: text("License country is required"),
  }),
  pickupDetails: z.object({
    address: text("Pickup address is required"),
    time: z.string().regex(TIME, "Pickup time is required"),
  }),
  returnDetails: z.object({
    address: text("Return address is required"),
    time: z.string().regex(TIME, "Return time is required"),
  }),
  extras: z.object({ extraDriver: z.boolean() }),
  notes: z.string(),
});

export type BookingDetailsForm = z.infer<typeof bookingDetailsSchema>;

export const emptyBookingForm: BookingDetailsForm = {
  userDetails: {
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    nationality: "",
    licenseNumber: "",
    licenseExpiry: "",
    licenseCountry: "",
  },
  pickupDetails: { address: "", time: "" },
  returnDetails: { address: "", time: "" },
  extras: { extraDriver: false },
  notes: "",
};

/** Fills the form from a saved booking, falling back to the logged-in user's name and email. */
export const bookingToFormValues = (
  booking: any,
  user?: Pick<User, "name" | "email"> | null
): BookingDetailsForm => ({
  userDetails: {
    fullName: booking.userDetails?.fullName || user?.name || "",
    email: booking.userDetails?.email || user?.email || "",
    phone: booking.userDetails?.phone || "",
    dateOfBirth: booking.userDetails?.dateOfBirth?.split("T")[0] || "",
    nationality: booking.userDetails?.nationality || "",
    licenseNumber: booking.userDetails?.licenseNumber || "",
    licenseExpiry: booking.userDetails?.licenseExpiry?.split("T")[0] || "",
    licenseCountry: booking.userDetails?.licenseCountry || "",
  },
  pickupDetails: {
    address: booking.pickupDetails?.address || "",
    time: booking.pickupDetails?.time || "",
  },
  returnDetails: {
    address: booking.returnDetails?.address || "",
    time: booking.returnDetails?.time || "",
  },
  extras: { extraDriver: booking.extras?.extraDriver || false },
  notes: booking.notes || "",
});
