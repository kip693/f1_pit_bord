import { describe, it, expect } from 'vitest';
import {
  processLapData,
  getBestLapByDriver,
  calculateTyreDegradation,
  filterLapsByRange,
} from '../lapAnalysis';
import type { Lap, Stint } from '@/lib/api/types';

const mockLaps: Lap[] = [
  {
    date_start: '2024-01-01T10:00:00Z',
    driver_number: 1,
    duration_sector_1: 25.5,
    duration_sector_2: 30.2,
    duration_sector_3: 28.3,
    i1_speed: 310,
    i2_speed: 290,
    is_pit_out_lap: false,
    lap_duration: 84.0,
    lap_number: 1,
    meeting_key: 1234,
    session_key: 12345,
    st_speed: 320,
    segments_sector_1: [2048, 2048],
    segments_sector_2: [2048, 2048],
    segments_sector_3: [2048, 2048],
  },
  {
    date_start: '2024-01-01T10:01:30Z',
    driver_number: 1,
    duration_sector_1: 25.3,
    duration_sector_2: 30.0,
    duration_sector_3: 28.1,
    i1_speed: 312,
    i2_speed: 292,
    is_pit_out_lap: false,
    lap_duration: 83.4,
    lap_number: 2,
    meeting_key: 1234,
    session_key: 12345,
    st_speed: 322,
    segments_sector_1: [2048, 2048],
    segments_sector_2: [2048, 2048],
    segments_sector_3: [2048, 2048],
  },
];

const mockStints: Stint[] = [
  {
    driver_number: 1,
    lap_start: 1,
    lap_end: 10,
    compound: 'SOFT',
    tyre_age_at_start: 0,
    meeting_key: 1234,
    session_key: 12345,
    stint_number: 1,
  },
];

describe('lapAnalysis', () => {
  describe('processLapData', () => {
    it('should process lap data into chart format', () => {
      const result = processLapData(mockLaps, [1]);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('lap_number', 1);
      expect(result[0]).toHaveProperty('driver_1', 84.0);
      expect(result[1]).toHaveProperty('driver_1', 83.4);
    });

    it('should exclude pit out laps', () => {
      const lapsWithPitOut = [
        ...mockLaps,
        {
          ...mockLaps[0],
          lap_number: 3,
          is_pit_out_lap: true,
          lap_duration: 120.0,
        },
      ];
      const result = processLapData(lapsWithPitOut, [1]);
      expect(result[2].driver_1).toBeNull();
    });

    it('should return empty array when no laps', () => {
      const result = processLapData([], [1]);
      expect(result).toEqual([]);
    });
  });

  describe('getBestLapByDriver', () => {
    it('should find best lap for driver', () => {
      const bestLap = getBestLapByDriver(mockLaps, 1);
      expect(bestLap).toBeDefined();
      expect(bestLap?.lap_duration).toBe(83.4);
    });

    it('should return null when driver has no laps', () => {
      const bestLap = getBestLapByDriver(mockLaps, 99);
      expect(bestLap).toBeNull();
    });

    it('should exclude pit out laps from best lap', () => {
      const lapsWithPitOut = [
        { ...mockLaps[0], is_pit_out_lap: true },
        mockLaps[1],
      ];
      const bestLap = getBestLapByDriver(lapsWithPitOut, 1);
      expect(bestLap?.is_pit_out_lap).toBe(false);
    });
  });

  describe('calculateTyreDegradation', () => {
    it('should calculate degradation for stint with enough laps', () => {
      const lapsForDegradation: Lap[] = [
        ...mockLaps,
        { ...mockLaps[0], lap_number: 3, lap_duration: 84.2 },
        { ...mockLaps[0], lap_number: 4, lap_duration: 84.5 },
      ];

      const result = calculateTyreDegradation(lapsForDegradation, mockStints);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('driver_number', 1);
      expect(result[0]).toHaveProperty('stint_number', 1);
      expect(result[0]).toHaveProperty('compound', 'SOFT');
      expect(result[0]).toHaveProperty('degradation_per_lap');
      expect(result[0]).toHaveProperty('r_squared');
    });

    it('should skip stints with less than 3 laps', () => {
      const result = calculateTyreDegradation(mockLaps.slice(0, 2), mockStints);
      expect(result).toHaveLength(0);
    });
  });

  describe('filterLapsByRange', () => {
    const chartData = [
      { lap_number: 1, driver_1: 84.0 },
      { lap_number: 2, driver_1: 83.4 },
      { lap_number: 3, driver_1: 83.8 },
      { lap_number: 4, driver_1: 84.1 },
      { lap_number: 5, driver_1: 84.3 },
    ];

    it('should filter by start lap', () => {
      const result = filterLapsByRange(chartData, 3);
      expect(result).toHaveLength(3);
      expect(result[0].lap_number).toBe(3);
    });

    it('should filter by end lap', () => {
      const result = filterLapsByRange(chartData, undefined, 3);
      expect(result).toHaveLength(3);
      expect(result[result.length - 1].lap_number).toBe(3);
    });

    it('should filter by both start and end lap', () => {
      const result = filterLapsByRange(chartData, 2, 4);
      expect(result).toHaveLength(3);
      expect(result[0].lap_number).toBe(2);
      expect(result[result.length - 1].lap_number).toBe(4);
    });

    it('should return all data when no range specified', () => {
      const result = filterLapsByRange(chartData);
      expect(result).toEqual(chartData);
    });
  });
});
