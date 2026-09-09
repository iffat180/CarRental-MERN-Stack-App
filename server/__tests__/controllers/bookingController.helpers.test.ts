import { describe, it, expect } from "@jest/globals";
import { __testables } from "../../controllers/bookingController.js";

// These exercise the REAL helper functions exported from the controller
// (no database connection required).
const { generateLockKey, isLocked, acquireLock, releaseLock, validateBookingDates } = __testables;

const CAR = "507f1f77bcf86cd799439011";

describe("generateLockKey", () => {
  it("is stable for the same inputs", () => {
    const a = generateLockKey(CAR, "2099-01-15", "2099-01-20");
    const b = generateLockKey(CAR, "2099-01-15", "2099-01-20");
    expect(a).toBe(b);
  });

  it("differs for different date ranges", () => {
    expect(generateLockKey(CAR, "2099-01-15", "2099-01-20")).not.toBe(
      generateLockKey(CAR, "2099-01-15", "2099-01-21")
    );
  });

  it("differs for different cars", () => {
    expect(generateLockKey(CAR, "2099-01-15", "2099-01-20")).not.toBe(
      generateLockKey("507f1f77bcf86cd799439012", "2099-01-15", "2099-01-20")
    );
  });
});

describe("acquireLock / isLocked / releaseLock", () => {
  it("acquires a lock and reports it as locked", () => {
    const key = generateLockKey(CAR, "2099-02-01", "2099-02-05");
    expect(isLocked(key)).toBe(false);
    acquireLock(key);
    expect(isLocked(key)).toBe(true);
    releaseLock(key);
    expect(isLocked(key)).toBe(false);
  });

  it("releasing a non-existent lock is a no-op", () => {
    expect(() => releaseLock(generateLockKey(CAR, "2099-03-01", "2099-03-02"))).not.toThrow();
  });
});

describe("validateBookingDates", () => {
  const future = (days: number) => new Date(Date.now() + days * 86_400_000);

  it("accepts a valid future range", () => {
    expect(validateBookingDates(future(2), future(5))).toBeNull();
  });

  it("rejects a pickup date in the past", () => {
    expect(validateBookingDates(future(-2), future(5))).toBe("Pickup date cannot be in the past");
  });

  it("rejects a return date not after pickup", () => {
    expect(validateBookingDates(future(5), future(5))).toBe("Return date must be after pickup date");
    expect(validateBookingDates(future(5), future(3))).toBe("Return date must be after pickup date");
  });

  it("rejects unparseable dates", () => {
    expect(validateBookingDates("not-a-date", future(5))).toBe("Invalid pickup or return date");
  });
});
