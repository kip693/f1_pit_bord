import { get } from '../client';
import type { Lap, LapsParams } from '../types';

export const lapsApi = {
  /**
   * ラップタイムを取得
   */
  async getLaps(params?: LapsParams): Promise<Lap[]> {
    return get<Lap[]>('/laps', params);
  },

  /**
   * セッション内の全ラップタイムを取得
   */
  async getLapsBySession(sessionKey: number): Promise<Lap[]> {
    return get<Lap[]>('/laps', { session_key: sessionKey });
  },

  /**
   * 特定ドライバーのラップタイムを取得
   */
  async getLapsByDriver(
    sessionKey: number,
    driverNumber: number,
  ): Promise<Lap[]> {
    const laps = await get<Lap[]>('/laps', {
      session_key: sessionKey,
      driver_number: driverNumber,
    });
    // ラップ番号順にソート
    return laps.sort((a, b) => a.lap_number - b.lap_number);
  },

  /**
   * ベストラップを取得（セッション全体）
   */
  async getBestLap(sessionKey: number): Promise<Lap | null> {
    const laps = await get<Lap[]>('/laps', { session_key: sessionKey });
    const validLaps = laps.filter(
      (lap) => lap.lap_duration !== null && !lap.is_pit_out_lap,
    );
    if (validLaps.length === 0) return null;

    return validLaps.reduce((best, current) =>
      current.lap_duration! < best.lap_duration! ? current : best,
    );
  },

  /**
   * ドライバー別ベストラップを取得
   */
  async getBestLapByDriver(
    sessionKey: number,
    driverNumber: number,
  ): Promise<Lap | null> {
    const laps = await this.getLapsByDriver(sessionKey, driverNumber);
    const validLaps = laps.filter(
      (lap) => lap.lap_duration !== null && !lap.is_pit_out_lap,
    );
    if (validLaps.length === 0) return null;

    return validLaps.reduce((best, current) =>
      current.lap_duration! < best.lap_duration! ? current : best,
    );
  },
};
