import { describe, it, expect } from 'vitest';

// Utility functions extracted from BookingSummary.jsx for testing
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour12}:${minutes} ${ampm}`;
};

const calculateDays = (pickupDate, returnDate) => {
  if (!pickupDate || !returnDate) return 0;
  const pickup = new Date(pickupDate);
  const returnD = new Date(returnDate);
  const diffTime = returnD - pickup;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
};

describe('Booking Utility Functions', () => {
  describe('formatDate', () => {
    it('should format valid date strings', () => {
      const date = '2024-01-15';
      const formatted = formatDate(date);
      expect(formatted).toContain('January');
      // Date might be formatted as 14 or 15 depending on timezone, so check for either
      expect(formatted).toMatch(/1[45]/); // Matches 14 or 15
      expect(formatted).toContain('2024');
    });

    it('should return empty string for null input', () => {
      expect(formatDate(null)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(formatDate(undefined)).toBe('');
    });

    it('should return empty string for empty string input', () => {
      expect(formatDate('')).toBe('');
    });

    it('should handle ISO date strings', () => {
      const date = '2024-01-15T10:00:00Z';
      const formatted = formatDate(date);
      expect(formatted).toContain('January');
      expect(formatted).toContain('15');
    });
  });

  describe('formatTime', () => {
    it('should format morning times correctly', () => {
      expect(formatTime('08:00')).toBe('8:00 AM');
      expect(formatTime('09:30')).toBe('9:30 AM');
      expect(formatTime('11:59')).toBe('11:59 AM');
    });

    it('should format noon correctly', () => {
      expect(formatTime('12:00')).toBe('12:00 PM');
      expect(formatTime('12:30')).toBe('12:30 PM');
    });

    it('should format afternoon times correctly', () => {
      expect(formatTime('13:00')).toBe('1:00 PM');
      expect(formatTime('15:30')).toBe('3:30 PM');
      expect(formatTime('17:45')).toBe('5:45 PM');
    });

    it('should format evening times correctly', () => {
      expect(formatTime('20:00')).toBe('8:00 PM');
      expect(formatTime('22:00')).toBe('10:00 PM');
    });

    it('should format midnight correctly', () => {
      expect(formatTime('00:00')).toBe('12:00 AM');
    });

    it('should return empty string for null input', () => {
      expect(formatTime(null)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(formatTime(undefined)).toBe('');
    });

    it('should return empty string for empty string input', () => {
      expect(formatTime('')).toBe('');
    });
  });

  describe('calculateDays', () => {
    it('should calculate single day rental', () => {
      const pickupDate = '2024-01-15';
      const returnDate = '2024-01-16';
      expect(calculateDays(pickupDate, returnDate)).toBe(1);
    });

    it('should calculate multi-day rental', () => {
      const pickupDate = '2024-01-15';
      const returnDate = '2024-01-20';
      expect(calculateDays(pickupDate, returnDate)).toBe(5);
    });

    it('should calculate week-long rental', () => {
      const pickupDate = '2024-01-15';
      const returnDate = '2024-01-22';
      expect(calculateDays(pickupDate, returnDate)).toBe(7);
    });

    it('should use Math.ceil for partial days', () => {
      const pickupDate = '2024-01-15T10:00:00Z';
      const returnDate = '2024-01-16T14:00:00Z'; // 1 day and 4 hours
      expect(calculateDays(pickupDate, returnDate)).toBe(2);
    });

    it('should return minimum 1 day for same day rental', () => {
      const pickupDate = '2024-01-15T10:00:00Z';
      const returnDate = '2024-01-15T18:00:00Z'; // Same day, 8 hours
      expect(calculateDays(pickupDate, returnDate)).toBe(1);
    });

    it('should return 0 for null pickup date', () => {
      expect(calculateDays(null, '2024-01-16')).toBe(0);
    });

    it('should return 0 for null return date', () => {
      expect(calculateDays('2024-01-15', null)).toBe(0);
    });

    it('should return 0 for both null dates', () => {
      expect(calculateDays(null, null)).toBe(0);
    });

    it('should return 0 for undefined dates', () => {
      expect(calculateDays(undefined, undefined)).toBe(0);
    });

    it('should handle edge case where return is before pickup (should return 1)', () => {
      const pickupDate = '2024-01-20';
      const returnDate = '2024-01-15';
      // This would result in negative days, but function returns 1 as minimum
      const result = calculateDays(pickupDate, returnDate);
      expect(result).toBe(1); // Math.ceil of negative would be negative, but function ensures min 1
    });
  });
});

