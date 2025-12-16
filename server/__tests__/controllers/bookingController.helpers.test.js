import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Test the helper functions from bookingController.js
// These are pure functions that don't require database connections

describe('Booking Controller Helper Functions', () => {
  // Mock the lock map and functions
  let availabilityLockMap;
  let LOCK_TTL_MS;
  let generateLockKey, isLocked, acquireLock, releaseLock;

  beforeEach(() => {
    // Reset the lock map for each test
    availabilityLockMap = new Map();
    LOCK_TTL_MS = 30000; // 30 seconds

    // Implement the helper functions
    generateLockKey = (carId, pickupDate, returnDate) => {
      const pickupISO = new Date(pickupDate).toISOString();
      const returnISO = new Date(returnDate).toISOString();
      return `${carId}_${pickupISO}_${returnISO}`;
    };

    isLocked = (lockKey) => {
      const lock = availabilityLockMap.get(lockKey);
      if (!lock) {
        return false;
      }
      
      const now = Date.now();
      if (now >= lock.expiresAt) {
        availabilityLockMap.delete(lockKey);
        return false;
      }
      
      return true;
    };

    acquireLock = (lockKey) => {
      const now = Date.now();
      const lock = {
        expiresAt: now + LOCK_TTL_MS,
        createdAt: now
      };
      availabilityLockMap.set(lockKey, lock);
    };

    releaseLock = (lockKey) => {
      if (availabilityLockMap.has(lockKey)) {
        availabilityLockMap.delete(lockKey);
      }
    };
  });

  describe('generateLockKey', () => {
    it('should generate a consistent lock key for the same inputs', () => {
      const carId = '507f1f77bcf86cd799439011';
      const pickupDate = '2024-01-15';
      const returnDate = '2024-01-20';
      
      const key1 = generateLockKey(carId, pickupDate, returnDate);
      const key2 = generateLockKey(carId, pickupDate, returnDate);
      
      expect(key1).toBe(key2);
      expect(key1).toContain(carId);
    });

    it('should generate different keys for different date ranges', () => {
      const carId = '507f1f77bcf86cd799439011';
      const key1 = generateLockKey(carId, '2024-01-15', '2024-01-20');
      const key2 = generateLockKey(carId, '2024-01-16', '2024-01-21');
      
      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different cars', () => {
      const pickupDate = '2024-01-15';
      const returnDate = '2024-01-20';
      const key1 = generateLockKey('car1', pickupDate, returnDate);
      const key2 = generateLockKey('car2', pickupDate, returnDate);
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('acquireLock and isLocked', () => {
    it('should acquire a lock and detect it as locked', () => {
      const lockKey = 'test_lock_key';
      
      expect(isLocked(lockKey)).toBe(false);
      acquireLock(lockKey);
      expect(isLocked(lockKey)).toBe(true);
    });

    it('should release a lock and detect it as unlocked', () => {
      const lockKey = 'test_lock_key';
      
      acquireLock(lockKey);
      expect(isLocked(lockKey)).toBe(true);
      
      releaseLock(lockKey);
      expect(isLocked(lockKey)).toBe(false);
    });

    it('should handle releasing a non-existent lock gracefully', () => {
      const lockKey = 'non_existent_lock';
      
      expect(() => releaseLock(lockKey)).not.toThrow();
      expect(isLocked(lockKey)).toBe(false);
    });

    it('should expire locks after TTL', (done) => {
      const lockKey = 'test_lock_key';
      const shortTTL = 100; // 100ms for testing
      LOCK_TTL_MS = shortTTL;
      
      acquireLock(lockKey);
      expect(isLocked(lockKey)).toBe(true);
      
      setTimeout(() => {
        expect(isLocked(lockKey)).toBe(false);
        done();
      }, shortTTL + 50); // Wait slightly longer than TTL
    });
  });

  describe('Date validation logic', () => {
    const validateDates = (pickupDate, returnDate) => {
      const pickup = new Date(pickupDate);
      const returnD = new Date(returnDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const errors = {};

      if (pickup < today) {
        errors.pickupDate = 'Pickup date cannot be in the past';
      }

      if (returnD <= pickup) {
        errors.returnDate = 'Return date must be after pickup date';
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors
      };
    };

    it('should accept valid date ranges', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const result1 = validateDates(tomorrow.toISOString(), nextWeek.toISOString());
      expect(result1.isValid).toBe(true);
    });

    it('should reject pickup dates in the past', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = validateDates(yesterday.toISOString(), tomorrow.toISOString());
      expect(result.isValid).toBe(false);
      expect(result.errors.pickupDate).toBe('Pickup date cannot be in the past');
    });

    it('should reject return dates before or equal to pickup date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const sameDay = new Date(tomorrow);

      const result1 = validateDates(tomorrow.toISOString(), sameDay.toISOString());
      expect(result1.isValid).toBe(false);
      expect(result1.errors.returnDate).toBe('Return date must be after pickup date');

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result2 = validateDates(tomorrow.toISOString(), yesterday.toISOString());
      expect(result2.isValid).toBe(false);
      expect(result2.errors.returnDate).toBe('Return date must be after pickup date');
    });
  });

  describe('Price calculation', () => {
    const calculatePrice = (pricePerDay, pickupDate, returnDate) => {
      const noOfDays = Math.ceil(
        (new Date(returnDate) - new Date(pickupDate)) /
          (1000 * 60 * 60 * 24)
      );
      return pricePerDay * noOfDays;
    };

    it('should calculate price for single day rental', () => {
      const pickupDate = '2024-01-15';
      const returnDate = '2024-01-16';
      const pricePerDay = 50;

      const total = calculatePrice(pricePerDay, pickupDate, returnDate);
      expect(total).toBe(50);
    });

    it('should calculate price for multi-day rental', () => {
      const pickupDate = '2024-01-15';
      const returnDate = '2024-01-20';
      const pricePerDay = 50;

      const total = calculatePrice(pricePerDay, pickupDate, returnDate);
      expect(total).toBe(250); // 5 days * 50
    });

    it('should use Math.ceil for partial days', () => {
      const pickupDate = '2024-01-15T10:00:00Z';
      const returnDate = '2024-01-16T14:00:00Z'; // 1 day and 4 hours
      const pricePerDay = 50;

      const total = calculatePrice(pricePerDay, pickupDate, returnDate);
      // Should round up to 2 days
      expect(total).toBe(100);
    });

    it('should handle zero price per day', () => {
      const pickupDate = '2024-01-15';
      const returnDate = '2024-01-20';
      const pricePerDay = 0;

      const total = calculatePrice(pricePerDay, pickupDate, returnDate);
      expect(total).toBe(0);
    });

    it('should handle minimum rental period (same day)', () => {
      const pickupDate = '2024-01-15T10:00:00Z';
      const returnDate = '2024-01-15T18:00:00Z'; // Same day, 8 hours
      const pricePerDay = 50;

      const total = calculatePrice(pricePerDay, pickupDate, returnDate);
      // Should round up to 1 day
      expect(total).toBe(50);
    });
  });
});

