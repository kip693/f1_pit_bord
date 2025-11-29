import { get } from '../client';
import type { Session, SessionsParams } from '../types';

export const sessionsApi = {
  /**
   * セッション一覧を取得
   */
  async getSessions(params?: SessionsParams): Promise<Session[]> {
    return get<Session[]>('/sessions', params);
  },

  /**
   * 特定のセッションを取得
   */
  async getSession(sessionKey: number): Promise<Session> {
    const sessions = await get<Session[]>('/sessions', {
      session_key: sessionKey,
    });
    if (sessions.length === 0) {
      throw new Error(`Session not found: ${sessionKey}`);
    }
    return sessions[0];
  },

  /**
   * 年度別セッション一覧を取得
   */
  async getSessionsByYear(year: number): Promise<Session[]> {
    return get<Session[]>('/sessions', { year });
  },

  /**
   * 利用可能な年度一覧を取得
   * OpenF1 APIは2023年以降のデータを提供
   */
  async getAvailableYears(): Promise<number[]> {
    // OpenF1 APIのデータ範囲: 2023年以降
    const currentYear = new Date().getFullYear();
    const startYear = 2023;
    const years: number[] = [];

    for (let year = currentYear; year >= startYear; year--) {
      years.push(year);
    }

    return years;
  },
};
