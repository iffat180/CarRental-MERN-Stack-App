import { describe, it, expect } from "vitest";
import {
  bookingDetailsSchema,
  bookingToFormValues,
  emptyBookingForm,
  isFutureDate,
  isPastDate,
  toLocalISODate,
  type BookingDetailsForm,
} from "../../schemas/bookingDetails";

const dayOffset = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalISODate(d);
};

const valid = (): BookingDetailsForm => ({
  userDetails: {
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    phone: "+1 555 0100",
    dateOfBirth: "1990-05-01",
    nationality: "British",
    licenseNumber: "LOVEL-12345",
    licenseExpiry: dayOffset(400),
    licenseCountry: "UK",
  },
  pickupDetails: { address: "Denver Airport", time: "10:00" },
  returnDetails: { address: "Denver Airport", time: "18:30" },
  extras: { extraDriver: false },
  notes: "",
});

/** Runs the schema and returns { "userDetails.phone": "message", ... } */
const errorsFor = (form: BookingDetailsForm) => {
  const result = bookingDetailsSchema.safeParse(form);
  if (result.success) return {};
  const out: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".");
    if (!(key in out)) out[key] = issue.message; // the first message per field is the one shown
  }
  return out;
};

describe("bookingDetailsSchema", () => {
  it("accepts a complete, valid form", () => {
    expect(bookingDetailsSchema.safeParse(valid()).success).toBe(true);
    expect(errorsFor(valid())).toEqual({});
  });

  it("reports every required field of an empty form with the original messages", () => {
    expect(errorsFor(emptyBookingForm)).toEqual({
      "userDetails.fullName": "Full name is required",
      "userDetails.email": "Valid email is required",
      "userDetails.phone": "Phone number is required",
      "userDetails.dateOfBirth": "Date of birth is required",
      "userDetails.nationality": "Nationality is required",
      "userDetails.licenseNumber": "License number is required",
      "userDetails.licenseExpiry": "License expiry date is required",
      "userDetails.licenseCountry": "License country is required",
      "pickupDetails.address": "Pickup address is required",
      "pickupDetails.time": "Pickup time is required",
      "returnDetails.address": "Return address is required",
      "returnDetails.time": "Return time is required",
    });
  });

  it("treats whitespace-only text as empty", () => {
    const form = valid();
    form.userDetails.fullName = "   ";
    form.userDetails.phone = "\t";
    expect(errorsFor(form)).toEqual({
      "userDetails.fullName": "Full name is required",
      "userDetails.phone": "Phone number is required",
    });
  });

  it.each(["plainaddress", "a@b", "a b@c.com", "@c.com"])("rejects the email %s", (email) => {
    const form = valid();
    form.userDetails.email = email;
    expect(errorsFor(form)["userDetails.email"]).toBe("Valid email is required");
  });

  it("requires the date of birth to be in the past", () => {
    const form = valid();
    form.userDetails.dateOfBirth = dayOffset(1);
    expect(errorsFor(form)["userDetails.dateOfBirth"]).toBe("Date of birth must be in the past");
    form.userDetails.dateOfBirth = dayOffset(-1);
    expect(errorsFor(form)).toEqual({});
  });

  it("requires the license to expire in the future", () => {
    const form = valid();
    form.userDetails.licenseExpiry = dayOffset(-1);
    expect(errorsFor(form)["userDetails.licenseExpiry"]).toBe(
      "License expiry date must be in the future"
    );
    form.userDetails.licenseExpiry = dayOffset(1);
    expect(errorsFor(form)).toEqual({});
  });

  it("requires a time in HH:MM form", () => {
    const form = valid();
    form.pickupDetails.time = "9am";
    expect(errorsFor(form)["pickupDetails.time"]).toBe("Pickup time is required");
    form.pickupDetails.time = "09:00";
    expect(errorsFor(form)).toEqual({});
  });

  it("allows empty notes and either extra-driver value", () => {
    const form = valid();
    form.extras.extraDriver = true;
    form.notes = "Child seat please";
    expect(errorsFor(form)).toEqual({});
  });
});

describe("date helpers", () => {
  it("compares against the start of today", () => {
    expect(isPastDate(dayOffset(-1))).toBe(true);
    expect(isPastDate(dayOffset(0))).toBe(false);
    expect(isFutureDate(dayOffset(1))).toBe(true);
    expect(isFutureDate(dayOffset(0))).toBe(false);
  });

  it("treats an empty string as neither past nor future", () => {
    expect(isPastDate("")).toBe(false);
    expect(isFutureDate("")).toBe(false);
  });
});

describe("bookingToFormValues", () => {
  it("fills the form from a saved booking and trims ISO dates", () => {
    const form = bookingToFormValues(
      {
        userDetails: { fullName: "Ada", email: "a@b.co", dateOfBirth: "1990-05-01T00:00:00.000Z" },
        pickupDetails: { address: "A", time: "10:00" },
        extras: { extraDriver: true },
        notes: "hi",
      },
      { name: "Profile Name", email: "profile@x.co" }
    );
    expect(form.userDetails.fullName).toBe("Ada");
    expect(form.userDetails.dateOfBirth).toBe("1990-05-01");
    expect(form.pickupDetails.address).toBe("A");
    expect(form.returnDetails.time).toBe("");
    expect(form.extras.extraDriver).toBe(true);
    expect(form.notes).toBe("hi");
  });

  it("falls back to the profile's name and email", () => {
    const form = bookingToFormValues({}, { name: "Profile Name", email: "profile@x.co" });
    expect(form.userDetails.fullName).toBe("Profile Name");
    expect(form.userDetails.email).toBe("profile@x.co");
  });

  it("works with no booking details and no user", () => {
    expect(bookingToFormValues({}, null)).toEqual(emptyBookingForm);
  });
});
