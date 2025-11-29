import { get } from '../client';
import type { Driver, DriversParams } from '../types';

export const driversApi = {
  /**
   * ドライバー一覧を取得
   */
  async getDrivers(params?: DriversParams): Promise<Driver[]> {
    return get<Driver[]>('/drivers', params);
  },

  /**
   * セッション内のドライバー一覧を取得
   */
  async getDriversBySession(sessionKey: number): Promise<Driver[]> {
    const drivers = await get<Driver[]>('/drivers', {
      session_key: sessionKey,
    });
    // ドライバー番号順にソート
    return drivers.sort((a, b) => a.driver_number - b.driver_number);
  },

  /**
   * 特定のドライバーを取得
   */
  async getDriver(sessionKey: number, driverNumber: number): Promise<Driver> {
    const drivers = await get<Driver[]>('/drivers', {
      session_key: sessionKey,
      driver_number: driverNumber,
    });
    if (drivers.length === 0) {
      throw new Error(
        `Driver not found: ${driverNumber} in session ${sessionKey}`,
      );
    }
    return drivers[0];
  },
};
