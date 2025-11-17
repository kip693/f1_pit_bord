import { get } from '../client';
import type { PitStop, PitStopsParams } from '../types';

export const pitApi = {
  /**
   * ピットストップを取得
   */
  async getPitStops(params?: PitStopsParams): Promise<PitStop[]> {
    return get<PitStop[]>('/pit', params);
  },

  /**
   * セッション内の全ピットストップを取得
   */
  async getPitStopsBySession(sessionKey: number): Promise<PitStop[]> {
    const pitStops = await get<PitStop[]>('/pit', {
      session_key: sessionKey,
    });
    // 時刻順にソート
    return pitStops.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  },

  /**
   * 特定ドライバーのピットストップを取得
   */
  async getPitStopsByDriver(
    sessionKey: number,
    driverNumber: number,
  ): Promise<PitStop[]> {
    const pitStops = await get<PitStop[]>('/pit', {
      session_key: sessionKey,
      driver_number: driverNumber,
    });
    return pitStops.sort((a, b) => a.lap_number - b.lap_number);
  },
};
