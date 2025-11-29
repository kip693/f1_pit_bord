import { get } from '../client';
import type { Position, PositionsParams } from '../types';

export const positionsApi = {
  /**
   * ポジションを取得
   */
  async getPositions(params?: PositionsParams): Promise<Position[]> {
    return get<Position[]>('/position', params);
  },

  /**
   * セッション内の全ポジションを取得
   */
  async getPositionsBySession(sessionKey: number): Promise<Position[]> {
    return get<Position[]>('/position', { session_key: sessionKey });
  },

  /**
   * 特定ドライバーのポジション推移を取得
   */
  async getPositionsByDriver(
    sessionKey: number,
    driverNumber: number,
  ): Promise<Position[]> {
    const positions = await get<Position[]>('/position', {
      session_key: sessionKey,
      driver_number: driverNumber,
    });
    return positions.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  },
};
