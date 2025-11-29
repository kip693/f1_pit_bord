import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lapsApi } from '../laps';
import * as client from '../../client';
import type { Lap } from '../../types';

vi.mock('../../client');

describe('lapsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockLaps: Lap[] = [
    {
      date_start: '2024-03-02T14:00:00.000Z',
      driver_number: 1,
      duration_sector_1: 28.5,
      duration_sector_2: 35.2,
      duration_sector_3: 31.8,
      i1_speed: 320,
      i2_speed: 310,
      is_pit_out_lap: false,
      lap_duration: 95.5,
      lap_number: 1,
      meeting_key: 1234,
      session_key: 5678,
      st_speed: 325,
      segments_sector_1: [2048, 2048, 2048],
      segments_sector_2: [2048, 2048],
      segments_sector_3: [2048, 2048, 2048],
    },
    {
      date_start: '2024-03-02T14:01:35.500Z',
      driver_number: 1,
      duration_sector_1: 28.3,
      duration_sector_2: 35.0,
      duration_sector_3: 31.7,
      i1_speed: 322,
      i2_speed: 312,
      is_pit_out_lap: false,
      lap_duration: 95.0,
      lap_number: 2,
      meeting_key: 1234,
      session_key: 5678,
      st_speed: 327,
      segments_sector_1: [2048, 2048, 2048],
      segments_sector_2: [2048, 2048],
      segments_sector_3: [2048, 2048, 2048],
    },
  ];

  describe('getLaps', () => {
    it('should fetch laps successfully', async () => {
      vi.mocked(client.get).mockResolvedValue(mockLaps);

      const result = await lapsApi.getLaps({ session_key: 5678 });

      expect(client.get).toHaveBeenCalledWith('/laps', { session_key: 5678 });
      expect(result).toEqual(mockLaps);
    });
  });

  describe('getLapsBySession', () => {
    it('should fetch laps by session', async () => {
      vi.mocked(client.get).mockResolvedValue(mockLaps);

      const result = await lapsApi.getLapsBySession(5678);

      expect(client.get).toHaveBeenCalledWith('/laps', { session_key: 5678 });
      expect(result).toEqual(mockLaps);
    });
  });

  describe('getLapsByDriver', () => {
    it('should fetch and sort laps by driver', async () => {
      const unsortedLaps = [mockLaps[1], mockLaps[0]];
      vi.mocked(client.get).mockResolvedValue(unsortedLaps);

      const result = await lapsApi.getLapsByDriver(5678, 1);

      expect(client.get).toHaveBeenCalledWith('/laps', {
        session_key: 5678,
        driver_number: 1,
      });
      expect(result).toEqual(mockLaps); // ソート済み
      expect(result[0].lap_number).toBe(1);
      expect(result[1].lap_number).toBe(2);
    });
  });

  describe('getBestLap', () => {
    it('should return the fastest lap', async () => {
      vi.mocked(client.get).mockResolvedValue(mockLaps);

      const result = await lapsApi.getBestLap(5678);

      expect(result).toEqual(mockLaps[1]); // lap_duration: 95.0
    });

    it('should exclude pit out laps', async () => {
      const lapsWithPitOut: Lap[] = [
        { ...mockLaps[0], is_pit_out_lap: true },
        mockLaps[1],
      ];
      vi.mocked(client.get).mockResolvedValue(lapsWithPitOut);

      const result = await lapsApi.getBestLap(5678);

      expect(result).toEqual(mockLaps[1]);
    });

    it('should return null when no valid laps', async () => {
      vi.mocked(client.get).mockResolvedValue([]);

      const result = await lapsApi.getBestLap(5678);

      expect(result).toBeNull();
    });
  });

  describe('getBestLapByDriver', () => {
    it('should return the fastest lap for a driver', async () => {
      vi.mocked(client.get).mockResolvedValue(mockLaps);

      const result = await lapsApi.getBestLapByDriver(5678, 1);

      expect(result).toEqual(mockLaps[1]);
    });

    it('should return null when driver has no valid laps', async () => {
      vi.mocked(client.get).mockResolvedValue([]);

      const result = await lapsApi.getBestLapByDriver(5678, 1);

      expect(result).toBeNull();
    });
  });
});
