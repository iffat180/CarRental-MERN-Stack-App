import { describe, it, expect } from 'vitest';
import {
  BOOKING_STATUS,
  STATUS_CONFIG,
  STATUS_TRANSITIONS,
  canTransitionStatus,
  getStatusOptions,
  getStatusBadgeClasses,
} from '../../utils/bookingStatus';

describe('Booking Status Utilities', () => {
  describe('BOOKING_STATUS constants', () => {
    it('should have correct status values', () => {
      expect(BOOKING_STATUS.PENDING).toBe('pending');
      expect(BOOKING_STATUS.CONFIRMED).toBe('confirmed');
      expect(BOOKING_STATUS.CANCELLED).toBe('cancelled');
    });
  });

  describe('STATUS_CONFIG', () => {
    it('should have configuration for all statuses', () => {
      expect(STATUS_CONFIG[BOOKING_STATUS.PENDING]).toBeDefined();
      expect(STATUS_CONFIG[BOOKING_STATUS.CONFIRMED]).toBeDefined();
      expect(STATUS_CONFIG[BOOKING_STATUS.CANCELLED]).toBeDefined();
    });

    it('should have correct labels', () => {
      expect(STATUS_CONFIG[BOOKING_STATUS.PENDING].label).toBe('Pending');
      expect(STATUS_CONFIG[BOOKING_STATUS.CONFIRMED].label).toBe('Confirmed');
      expect(STATUS_CONFIG[BOOKING_STATUS.CANCELLED].label).toBe('Cancelled');
    });

    it('should have color classes', () => {
      expect(STATUS_CONFIG[BOOKING_STATUS.PENDING].bgColor).toContain('yellow');
      expect(STATUS_CONFIG[BOOKING_STATUS.CONFIRMED].bgColor).toContain('green');
      expect(STATUS_CONFIG[BOOKING_STATUS.CANCELLED].bgColor).toContain('red');
    });
  });

  describe('STATUS_TRANSITIONS', () => {
    it('should allow pending to transition to confirmed or cancelled', () => {
      const transitions = STATUS_TRANSITIONS[BOOKING_STATUS.PENDING];
      expect(transitions).toContain(BOOKING_STATUS.CONFIRMED);
      expect(transitions).toContain(BOOKING_STATUS.CANCELLED);
    });

    it('should not allow confirmed to transition', () => {
      const transitions = STATUS_TRANSITIONS[BOOKING_STATUS.CONFIRMED];
      expect(transitions).toEqual([]);
    });

    it('should not allow cancelled to transition', () => {
      const transitions = STATUS_TRANSITIONS[BOOKING_STATUS.CANCELLED];
      expect(transitions).toEqual([]);
    });
  });

  describe('canTransitionStatus', () => {
    it('should return true for valid transitions from pending', () => {
      expect(canTransitionStatus(BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED)).toBe(true);
      expect(canTransitionStatus(BOOKING_STATUS.PENDING, BOOKING_STATUS.CANCELLED)).toBe(true);
    });

    it('should return false for invalid transitions from pending', () => {
      expect(canTransitionStatus(BOOKING_STATUS.PENDING, BOOKING_STATUS.PENDING)).toBe(false);
    });

    it('should return false for transitions from confirmed', () => {
      expect(canTransitionStatus(BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PENDING)).toBe(false);
      expect(canTransitionStatus(BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CANCELLED)).toBe(false);
    });

    it('should return false for transitions from cancelled', () => {
      expect(canTransitionStatus(BOOKING_STATUS.CANCELLED, BOOKING_STATUS.PENDING)).toBe(false);
      expect(canTransitionStatus(BOOKING_STATUS.CANCELLED, BOOKING_STATUS.CONFIRMED)).toBe(false);
    });

    it('should handle unknown statuses gracefully', () => {
      expect(canTransitionStatus('unknown', BOOKING_STATUS.CONFIRMED)).toBe(false);
    });
  });

  describe('getStatusOptions', () => {
    it('should return current status and allowed transitions for pending', () => {
      const options = getStatusOptions(BOOKING_STATUS.PENDING);
      expect(options.length).toBe(3); // current + 2 transitions
      expect(options[0].value).toBe(BOOKING_STATUS.PENDING);
      expect(options.some(opt => opt.value === BOOKING_STATUS.CONFIRMED)).toBe(true);
      expect(options.some(opt => opt.value === BOOKING_STATUS.CANCELLED)).toBe(true);
    });

    it('should return only current status for confirmed', () => {
      const options = getStatusOptions(BOOKING_STATUS.CONFIRMED);
      expect(options.length).toBe(1);
      expect(options[0].value).toBe(BOOKING_STATUS.CONFIRMED);
    });

    it('should return only current status for cancelled', () => {
      const options = getStatusOptions(BOOKING_STATUS.CANCELLED);
      expect(options.length).toBe(1);
      expect(options[0].value).toBe(BOOKING_STATUS.CANCELLED);
    });

    it('should handle unknown statuses', () => {
      const options = getStatusOptions('unknown');
      expect(options.length).toBe(1);
      expect(options[0].value).toBe('unknown');
    });
  });

  describe('getStatusBadgeClasses', () => {
    it('should return correct classes for pending status', () => {
      const classes = getStatusBadgeClasses(BOOKING_STATUS.PENDING);
      expect(classes).toContain('yellow');
    });

    it('should return correct classes for confirmed status', () => {
      const classes = getStatusBadgeClasses(BOOKING_STATUS.CONFIRMED);
      expect(classes).toContain('green');
    });

    it('should return correct classes for cancelled status', () => {
      const classes = getStatusBadgeClasses(BOOKING_STATUS.CANCELLED);
      expect(classes).toContain('red');
    });

    it('should return default classes for unknown status', () => {
      const classes = getStatusBadgeClasses('unknown');
      expect(classes).toBe('bg-gray-100 text-gray-600');
    });

    it('should return default classes for null/undefined status', () => {
      expect(getStatusBadgeClasses(null)).toBe('bg-gray-100 text-gray-600');
      expect(getStatusBadgeClasses(undefined)).toBe('bg-gray-100 text-gray-600');
    });
  });
});

