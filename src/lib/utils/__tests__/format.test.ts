import { describe, it, expect } from 'vitest';
import {
  formatLapTime,
  formatSectorTime,
  formatSpeed,
  getTyreColor,
  getTyreAbbreviation,
  formatPosition,
  formatDelta,
} from '../format';

describe('format utils', () => {
  describe('formatLapTime', () => {
    it('should format lap time in MM:SS.fff format', () => {
      expect(formatLapTime(95.234)).toBe('1:35.234');
      expect(formatLapTime(65.123)).toBe('1:05.123');
      expect(formatLapTime(125.999)).toBe('2:05.999');
    });

    it('should handle null values', () => {
      expect(formatLapTime(null)).toBe('--:--.---');
    });
  });

  describe('formatSectorTime', () => {
    it('should format sector time with 3 decimals', () => {
      expect(formatSectorTime(28.123)).toBe('28.123');
      expect(formatSectorTime(35.456)).toBe('35.456');
    });

    it('should handle null values', () => {
      expect(formatSectorTime(null)).toBe('--.---');
    });
  });

  describe('formatSpeed', () => {
    it('should format speed in km/h', () => {
      expect(formatSpeed(320.5)).toBe('321 km/h');
      expect(formatSpeed(310.2)).toBe('310 km/h');
    });

    it('should handle null values', () => {
      expect(formatSpeed(null)).toBe('---');
    });
  });

  describe('getTyreColor', () => {
    it('should return correct colors for tire compounds', () => {
      expect(getTyreColor('SOFT')).toBe('#FF0000');
      expect(getTyreColor('MEDIUM')).toBe('#FFFF00');
      expect(getTyreColor('HARD')).toBe('#FFFFFF');
      expect(getTyreColor('INTERMEDIATE')).toBe('#00FF00');
      expect(getTyreColor('WET')).toBe('#0000FF');
    });

    it('should return default color for unknown compound', () => {
      expect(getTyreColor('UNKNOWN')).toBe('#CCCCCC');
    });
  });

  describe('getTyreAbbreviation', () => {
    it('should return correct abbreviations', () => {
      expect(getTyreAbbreviation('SOFT')).toBe('S');
      expect(getTyreAbbreviation('MEDIUM')).toBe('M');
      expect(getTyreAbbreviation('HARD')).toBe('H');
      expect(getTyreAbbreviation('INTERMEDIATE')).toBe('I');
      expect(getTyreAbbreviation('WET')).toBe('W');
    });

    it('should return first character for unknown compound', () => {
      expect(getTyreAbbreviation('UNKNOWN')).toBe('U');
    });
  });

  describe('formatPosition', () => {
    it('should format position with P prefix', () => {
      expect(formatPosition(1)).toBe('P1');
      expect(formatPosition(10)).toBe('P10');
      expect(formatPosition(20)).toBe('P20');
    });
  });

  describe('formatDelta', () => {
    it('should format positive delta with + sign', () => {
      expect(formatDelta(1.234)).toBe('+1.234');
      expect(formatDelta(0.500)).toBe('+0.500');
    });

    it('should format negative delta', () => {
      expect(formatDelta(-0.123)).toBe('-0.123');
    });

    it('should handle zero', () => {
      expect(formatDelta(0)).toBe('+0.000');
    });

    it('should handle null values', () => {
      expect(formatDelta(null)).toBe('---');
    });
  });
});
