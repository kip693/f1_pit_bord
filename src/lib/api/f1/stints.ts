import { get } from '../client';
import type { Stint, StintsParams } from '../types';

export const stintsApi = {
  /**
   * スティントを取得
   */
  async getStints(params?: StintsParams): Promise<Stint[]> {
    return get<Stint[]>('/stints', params);
  },

  /**
   * セッション内の全スティントを取得
   */
  async getStintsBySession(sessionKey: number): Promise<Stint[]> {
    return get<Stint[]>('/stints', { session_key: sessionKey });
  },

  /**
   * 特定ドライバーのスティントを取得
   */
  async getStintsByDriver(
    sessionKey: number,
    driverNumber: number,
  ): Promise<Stint[]> {
    const stints = await get<Stint[]>('/stints', {
      session_key: sessionKey,
      driver_number: driverNumber,
    });
    return stints.sort((a, b) => a.stint_number - b.stint_number);
  },
};
