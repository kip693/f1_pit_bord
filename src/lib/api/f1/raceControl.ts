import { get } from '../client';
import type { RaceControl, RaceControlParams } from '../types';

/**
 * レースコントロール情報（フラッグなど）を取得
 */
export async function getRaceControl(
  params: RaceControlParams,
): Promise<RaceControl[]> {
  return get<RaceControl[]>('/race_control', params);
}

/**
 * 特定セッションのフラッグ情報のみを取得
 */
export async function getFlags(sessionKey: number): Promise<RaceControl[]> {
  return get<RaceControl[]>('/race_control', {
    session_key: sessionKey,
  });
}
