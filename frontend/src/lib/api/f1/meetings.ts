import { get } from '../client';
import type { Meeting, MeetingsParams } from '../types';

export const meetingsApi = {
  /**
   * ミーティング（GP）一覧を取得
   */
  async getMeetings(params?: MeetingsParams): Promise<Meeting[]> {
    return get<Meeting[]>('/meetings', params);
  },

  /**
   * 特定のミーティングを取得
   */
  async getMeeting(meetingKey: number): Promise<Meeting> {
    const meetings = await get<Meeting[]>('/meetings', {
      meeting_key: meetingKey,
    });
    if (meetings.length === 0) {
      throw new Error(`Meeting not found: ${meetingKey}`);
    }
    return meetings[0];
  },

  /**
   * 年度別ミーティング一覧を取得
   */
  async getMeetingsByYear(year: number): Promise<Meeting[]> {
    const meetings = await get<Meeting[]>('/meetings', { year });
    // 開催日順にソート
    return meetings.sort(
      (a, b) =>
        new Date(a.date_start).getTime() - new Date(b.date_start).getTime(),
    );
  },
};
