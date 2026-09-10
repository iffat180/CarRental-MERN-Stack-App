import { describe, it, expect } from 'vitest';
import {
  getLocationsForCity,
  getAvailableCities,
  hasLocationData,
} from '../../utils/locationData';

describe('Location Data Utilities', () => {
  describe('getLocationsForCity', () => {
    it('should return locations for a valid city', () => {
      const locations = getLocationsForCity('New York');
      expect(Array.isArray(locations)).toBe(true);
      expect(locations.length).toBeGreaterThan(0);
      expect(locations[0]).toBe('JFK Airport – Rental Car Center');
    });

    it('should return locations for Chicago', () => {
      const locations = getLocationsForCity('Chicago');
      expect(locations.length).toBeGreaterThan(0);
      expect(locations).toContain('O\'Hare Airport – Rental Car Center');
    });

    it('should return locations for Los Angeles', () => {
      const locations = getLocationsForCity('Los Angeles');
      expect(locations.length).toBeGreaterThan(0);
      expect(locations).toContain('LAX Airport – Consolidated Rental Car Facility');
    });

    it('should return empty array for invalid city', () => {
      const locations = getLocationsForCity('InvalidCity');
      expect(locations).toEqual([]);
    });

    it('should return empty array for null city', () => {
      const locations = getLocationsForCity(null);
      expect(locations).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      const locations = getLocationsForCity('');
      expect(locations).toEqual([]);
    });

    it('should return empty array for undefined city', () => {
      const locations = getLocationsForCity(undefined);
      expect(locations).toEqual([]);
    });

    it('should be case-sensitive', () => {
      const locations1 = getLocationsForCity('New York');
      const locations2 = getLocationsForCity('new york');
      expect(locations1.length).toBeGreaterThan(0);
      expect(locations2).toEqual([]);
    });
  });

  describe('getAvailableCities', () => {
    it('should return an array of cities', () => {
      const cities = getAvailableCities();
      expect(Array.isArray(cities)).toBe(true);
      expect(cities.length).toBeGreaterThan(0);
    });

    it('should include major cities', () => {
      const cities = getAvailableCities();
      expect(cities).toContain('New York');
      expect(cities).toContain('Chicago');
      expect(cities).toContain('Los Angeles');
      expect(cities).toContain('San Francisco');
    });

    it('should return consistent results', () => {
      const cities1 = getAvailableCities();
      const cities2 = getAvailableCities();
      expect(cities1).toEqual(cities2);
    });
  });

  describe('hasLocationData', () => {
    it('should return true for valid cities', () => {
      expect(hasLocationData('New York')).toBe(true);
      expect(hasLocationData('Chicago')).toBe(true);
      expect(hasLocationData('Los Angeles')).toBe(true);
      expect(hasLocationData('Houston')).toBe(true);
      expect(hasLocationData('Seattle')).toBe(true);
    });

    it('should return false for invalid cities', () => {
      expect(hasLocationData('InvalidCity')).toBe(false);
      expect(hasLocationData('RandomCity')).toBe(false);
    });

    it('should return false for null', () => {
      expect(hasLocationData(null)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(hasLocationData('')).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(hasLocationData(undefined)).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(hasLocationData('New York')).toBe(true);
      expect(hasLocationData('new york')).toBe(false);
    });
  });
});

