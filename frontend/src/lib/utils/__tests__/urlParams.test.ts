import { describe, it, expect } from 'vitest';
import {
  parseSessionParams,
  buildSessionParams,
  parseDriverFilterParams,
  buildDriverFilterParams,
  parseLapRangeParams,
  buildLapRangeParams,
  mergeSearchParams,
  stringifySearchParams,
} from '../urlParams';

describe('urlParams', () => {
  describe('parseSessionParams', () => {
    it('should parse session parameters correctly', () => {
      const params = new URLSearchParams('year=2024&meeting=1234&session=5678');
      const result = parseSessionParams(params);

      expect(result).toEqual({
        year: 2024,
        meeting: 1234,
        session: 5678,
      });
    });

    it('should handle missing parameters', () => {
      const params = new URLSearchParams('year=2024');
      const result = parseSessionParams(params);

      expect(result).toEqual({
        year: 2024,
        meeting: undefined,
        session: undefined,
      });
    });

    it('should handle empty parameters', () => {
      const params = new URLSearchParams('');
      const result = parseSessionParams(params);

      expect(result).toEqual({
        year: undefined,
        meeting: undefined,
        session: undefined,
      });
    });
  });

  describe('buildSessionParams', () => {
    it('should build session parameters correctly', () => {
      const params = {
        year: 2024,
        meeting: 1234,
        session: 5678,
      };
      const result = buildSessionParams(params);

      expect(result.get('year')).toBe('2024');
      expect(result.get('meeting')).toBe('1234');
      expect(result.get('session')).toBe('5678');
    });

    it('should skip undefined values', () => {
      const params = {
        year: 2024,
      };
      const result = buildSessionParams(params);

      expect(result.get('year')).toBe('2024');
      expect(result.has('meeting')).toBe(false);
      expect(result.has('session')).toBe(false);
    });
  });

  describe('parseDriverFilterParams', () => {
    it('should parse driver filter parameters correctly', () => {
      const params = new URLSearchParams('drivers=1,44,16&teams=Ferrari,Mercedes&favorites=true');
      const result = parseDriverFilterParams(params);

      expect(result).toEqual({
        drivers: [1, 44, 16],
        teams: ['Ferrari', 'Mercedes'],
        favorites: true,
      });
    });

    it('should handle encoded team names', () => {
      const params = new URLSearchParams('teams=Red%20Bull%20Racing');
      const result = parseDriverFilterParams(params);

      expect(result.teams).toEqual(['Red Bull Racing']);
    });

    it('should handle missing parameters', () => {
      const params = new URLSearchParams('');
      const result = parseDriverFilterParams(params);

      expect(result).toEqual({
        drivers: undefined,
        teams: undefined,
        favorites: false,
      });
    });
  });

  describe('buildDriverFilterParams', () => {
    it('should build driver filter parameters correctly', () => {
      const params = {
        drivers: [1, 44, 16],
        teams: ['Ferrari', 'Mercedes'],
        favorites: true,
      };
      const result = buildDriverFilterParams(params);

      expect(result.get('drivers')).toBe('1,44,16');
      expect(result.get('teams')).toBe('Ferrari,Mercedes');
      expect(result.get('favorites')).toBe('true');
    });

    it('should skip empty arrays', () => {
      const params = {
        drivers: [],
        teams: [],
        favorites: false,
      };
      const result = buildDriverFilterParams(params);

      expect(result.has('drivers')).toBe(false);
      expect(result.has('teams')).toBe(false);
      expect(result.has('favorites')).toBe(false);
    });
  });

  describe('parseLapRangeParams', () => {
    it('should parse lap range parameters correctly', () => {
      const params = new URLSearchParams('lapStart=10&lapEnd=30');
      const result = parseLapRangeParams(params);

      expect(result).toEqual({
        lapStart: 10,
        lapEnd: 30,
      });
    });
  });

  describe('buildLapRangeParams', () => {
    it('should build lap range parameters correctly', () => {
      const params = {
        lapStart: 10,
        lapEnd: 30,
      };
      const result = buildLapRangeParams(params);

      expect(result.get('lapStart')).toBe('10');
      expect(result.get('lapEnd')).toBe('30');
    });
  });

  describe('mergeSearchParams', () => {
    it('should merge multiple search params', () => {
      const params1 = new URLSearchParams('year=2024&meeting=1234');
      const params2 = new URLSearchParams('session=5678');
      const params3 = new URLSearchParams('drivers=1,44');

      const result = mergeSearchParams(params1, params2, params3);

      expect(result.get('year')).toBe('2024');
      expect(result.get('meeting')).toBe('1234');
      expect(result.get('session')).toBe('5678');
      expect(result.get('drivers')).toBe('1,44');
    });

    it('should overwrite duplicate keys', () => {
      const params1 = new URLSearchParams('year=2023');
      const params2 = new URLSearchParams('year=2024');

      const result = mergeSearchParams(params1, params2);

      expect(result.get('year')).toBe('2024');
    });
  });

  describe('stringifySearchParams', () => {
    it('should convert search params to string with question mark', () => {
      const params = new URLSearchParams('year=2024&session=5678');
      const result = stringifySearchParams(params);

      expect(result).toBe('?year=2024&session=5678');
    });

    it('should return empty string for empty params', () => {
      const params = new URLSearchParams('');
      const result = stringifySearchParams(params);

      expect(result).toBe('');
    });
  });
});
