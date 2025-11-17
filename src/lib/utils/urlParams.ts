/**
 * URLパラメータ管理ユーティリティ
 */

// セッション選択パラメータ
export interface SessionParams {
  year?: number;
  meeting?: number;
  session?: number;
}

// ドライバーフィルタパラメータ
export interface DriverFilterParams {
  drivers?: number[];
  teams?: string[];
  favorites?: boolean;
}

// ラップ範囲フィルタパラメータ
export interface LapRangeParams {
  lapStart?: number;
  lapEnd?: number;
}

/**
 * URLSearchParamsからセッションパラメータを解析
 */
export function parseSessionParams(
  searchParams: URLSearchParams,
): SessionParams {
  const year = searchParams.get('year');
  const meeting = searchParams.get('meeting');
  const session = searchParams.get('session');

  return {
    year: year ? parseInt(year, 10) : undefined,
    meeting: meeting ? parseInt(meeting, 10) : undefined,
    session: session ? parseInt(session, 10) : undefined,
  };
}

/**
 * セッションパラメータからURLSearchParamsを構築
 */
export function buildSessionParams(params: SessionParams): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (params.year) {
    searchParams.set('year', params.year.toString());
  }
  if (params.meeting) {
    searchParams.set('meeting', params.meeting.toString());
  }
  if (params.session) {
    searchParams.set('session', params.session.toString());
  }

  return searchParams;
}

/**
 * URLSearchParamsからドライバーフィルタパラメータを解析
 */
export function parseDriverFilterParams(
  searchParams: URLSearchParams,
): DriverFilterParams {
  const driversParam = searchParams.get('drivers');
  const teamsParam = searchParams.get('teams');
  const favoritesParam = searchParams.get('favorites');

  return {
    drivers: driversParam
      ? driversParam.split(',').map((d) => parseInt(d, 10))
      : undefined,
    teams: teamsParam
      ? decodeURIComponent(teamsParam).split(',')
      : undefined,
    favorites: favoritesParam === 'true',
  };
}

/**
 * ドライバーフィルタパラメータからURLSearchParamsを構築
 */
export function buildDriverFilterParams(
  params: DriverFilterParams,
): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (params.drivers && params.drivers.length > 0) {
    searchParams.set('drivers', params.drivers.join(','));
  }

  if (params.teams && params.teams.length > 0) {
    searchParams.set('teams', params.teams.join(','));
  }

  if (params.favorites) {
    searchParams.set('favorites', 'true');
  }

  return searchParams;
}

/**
 * URLSearchParamsからラップ範囲パラメータを解析
 */
export function parseLapRangeParams(
  searchParams: URLSearchParams,
): LapRangeParams {
  const lapStart = searchParams.get('lapStart');
  const lapEnd = searchParams.get('lapEnd');

  return {
    lapStart: lapStart ? parseInt(lapStart, 10) : undefined,
    lapEnd: lapEnd ? parseInt(lapEnd, 10) : undefined,
  };
}

/**
 * ラップ範囲パラメータからURLSearchParamsを構築
 */
export function buildLapRangeParams(params: LapRangeParams): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (params.lapStart) {
    searchParams.set('lapStart', params.lapStart.toString());
  }
  if (params.lapEnd) {
    searchParams.set('lapEnd', params.lapEnd.toString());
  }

  return searchParams;
}

/**
 * 複数のURLSearchParamsをマージ
 */
export function mergeSearchParams(
  ...params: URLSearchParams[]
): URLSearchParams {
  const merged = new URLSearchParams();

  params.forEach((param) => {
    param.forEach((value, key) => {
      merged.set(key, value);
    });
  });

  return merged;
}

/**
 * URLSearchParamsを文字列に変換（空の場合は空文字を返す）
 */
export function stringifySearchParams(params: URLSearchParams): string {
  const str = params.toString();
  return str ? `?${str}` : '';
}
