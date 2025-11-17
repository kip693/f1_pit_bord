# API Client仕様書

## 1. 概要
本ドキュメントは、Open F1 APIとの通信を担うAPIクライアントの詳細仕様を定義します。

---

## 2. Open F1 API概要

### 2.1 基本情報
- **ベースURL**: `https://api.openf1.org/v1`
- **プロトコル**: HTTPS
- **認証**: 不要（オープンAPI）
- **レート制限**: 明示的な制限なし（適切な利用を推奨）
- **データフォーマット**: JSON

### 2.2 主要エンドポイント

| エンドポイント | 説明 | 主要パラメータ |
|---------------|------|---------------|
| `/sessions` | セッション一覧 | `year`, `session_key`, `meeting_key` |
| `/meetings` | ミーティング（GP）一覧 | `year`, `meeting_key` |
| `/drivers` | ドライバー情報 | `session_key`, `driver_number` |
| `/laps` | ラップタイム | `session_key`, `driver_number`, `lap_number` |
| `/pit` | ピットストップ | `session_key`, `driver_number` |
| `/position` | ポジション（順位）推移 | `session_key`, `driver_number` |
| `/intervals` | インターバル（ギャップタイム） | `session_key`, `driver_number` |
| `/car_data` | カーテレメトリー | `session_key`, `driver_number` |
| `/location` | 位置情報 | `session_key`, `driver_number` |
| `/stints` | スティント（タイヤ）情報 | `session_key`, `driver_number` |
| `/weather` | 天候データ | `session_key` |

### 2.3 共通クエリパラメータ
- **フィルタリング**: すべてのフィールドで等価フィルタ可能
  - 例: `?session_key=9158&driver_number=1`
- **範囲指定**: 数値・日時フィールドで範囲指定可能
  - 例: `?date>=2024-01-01&date<2024-12-31`
- **ソート**: `?sort=field_name` または `?sort=-field_name`（降順）
- **ページネーション**: デフォルトで全件返却（大量データに注意）

---

## 3. APIクライアント設計

### 3.1 アーキテクチャ

```
┌─────────────────┐
│   Components    │
│  (React/Next)   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Data Hooks    │
│ (SWR/ReactQuery)│
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   API Service   │
│  (api/f1.ts)    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   HTTP Client   │
│ (axios/fetch)   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Open F1 API   │
└─────────────────┘
```

### 3.2 ディレクトリ構成
```
src/
├── lib/
│   ├── api/
│   │   ├── client.ts          # HTTPクライアント（axios設定）
│   │   ├── f1/
│   │   │   ├── index.ts       # 全エクスポート
│   │   │   ├── sessions.ts    # セッション関連API
│   │   │   ├── meetings.ts    # ミーティング関連API
│   │   │   ├── drivers.ts     # ドライバー関連API
│   │   │   ├── laps.ts        # ラップタイム関連API
│   │   │   ├── pit.ts         # ピット関連API
│   │   │   ├── position.ts    # ポジション関連API
│   │   │   ├── intervals.ts   # インターバル関連API
│   │   │   ├── car-data.ts    # テレメトリー関連API
│   │   │   ├── stints.ts      # スティント関連API
│   │   │   └── weather.ts     # 天候関連API
│   │   └── types.ts           # 型定義
│   └── hooks/
│       └── useF1Data.ts       # データフェッチフック
└── utils/
    ├── cache.ts               # キャッシュユーティリティ
    └── error.ts               # エラーハンドリング
```

---

## 4. 型定義

### 4.1 基本型定義

```typescript
// src/lib/api/types.ts

// ========== 共通型 ==========

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
}

export interface DateRangeParams {
  date_start?: string; // ISO 8601 format
  date_end?: string;
}

// ========== セッション ==========

export type SessionType =
  | 'Practice 1'
  | 'Practice 2'
  | 'Practice 3'
  | 'Qualifying'
  | 'Sprint'
  | 'Race';

export interface Session {
  session_key: number;
  session_name: SessionType;
  date_start: string; // ISO 8601
  date_end: string;
  gmt_offset: string;
  session_type: string;
  meeting_key: number;
  location: string;
  country_name: string;
  country_code: string;
  circuit_key: number;
  circuit_short_name: string;
  year: number;
}

export interface SessionsParams {
  year?: number;
  session_key?: number;
  meeting_key?: number;
  session_name?: SessionType;
  country_name?: string;
}

// ========== ミーティング（GP） ==========

export interface Meeting {
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  location: string;
  country_name: string;
  country_code: string;
  circuit_key: number;
  circuit_short_name: string;
  date_start: string;
  year: number;
}

export interface MeetingsParams {
  year?: number;
  meeting_key?: number;
  country_name?: string;
}

// ========== ドライバー ==========

export interface Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  first_name: string;
  last_name: string;
  headshot_url: string | null;
  country_code: string;
  session_key: number;
  meeting_key: number;
}

export interface DriversParams {
  session_key?: number;
  driver_number?: number;
  team_name?: string;
}

// ========== ラップタイム ==========

export interface Lap {
  date_start: string;
  driver_number: number;
  duration_sector_1: number | null; // 秒
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  i1_speed: number | null; // km/h
  i2_speed: number | null;
  is_pit_out_lap: boolean;
  lap_duration: number | null; // 秒
  lap_number: number;
  meeting_key: number;
  session_key: number;
  st_speed: number | null; // スピードトラップ
  segments_sector_1: number[];
  segments_sector_2: number[];
  segments_sector_3: number[];
}

export interface LapsParams {
  session_key?: number;
  driver_number?: number;
  lap_number?: number;
}

// ========== ピットストップ ==========

export interface PitStop {
  date: string;
  driver_number: number;
  lap_number: number;
  pit_duration: number; // 秒
  session_key: number;
  meeting_key: number;
}

export interface PitStopsParams {
  session_key?: number;
  driver_number?: number;
}

// ========== ポジション ==========

export interface Position {
  date: string;
  driver_number: number;
  meeting_key: number;
  position: number;
  session_key: number;
}

export interface PositionsParams {
  session_key?: number;
  driver_number?: number;
  position?: number;
}

// ========== インターバル（ギャップタイム） ==========

export interface Interval {
  date: string;
  driver_number: number;
  gap_to_leader: number | null; // 秒
  interval: number | null; // 前車とのギャップ（秒）
  meeting_key: number;
  session_key: number;
}

export interface IntervalsParams {
  session_key?: number;
  driver_number?: number;
}

// ========== カーテレメトリー ==========

export interface CarData {
  brake: number; // 0-100
  date: string;
  driver_number: number;
  drs: number; // 0-14 (0=off, 10-14=on)
  meeting_key: number;
  n_gear: number; // 1-8
  rpm: number;
  session_key: number;
  speed: number; // km/h
  throttle: number; // 0-100
}

export interface CarDataParams {
  session_key?: number;
  driver_number?: number;
  speed_gte?: number; // 速度下限
  speed_lte?: number; // 速度上限
}

// ========== ロケーション ==========

export interface Location {
  date: string;
  driver_number: number;
  meeting_key: number;
  session_key: number;
  x: number;
  y: number;
  z: number;
}

export interface LocationsParams {
  session_key?: number;
  driver_number?: number;
}

// ========== スティント（タイヤ） ==========

export type TireCompound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET';

export interface Stint {
  compound: TireCompound;
  driver_number: number;
  lap_start: number;
  lap_end: number;
  meeting_key: number;
  session_key: number;
  stint_number: number;
  tyre_age_at_start: number;
}

export interface StintsParams {
  session_key?: number;
  driver_number?: number;
  stint_number?: number;
  compound?: TireCompound;
}

// ========== 天候 ==========

export interface Weather {
  air_temperature: number; // 摂氏
  date: string;
  humidity: number; // パーセント
  meeting_key: number;
  pressure: number; // mbar
  rainfall: number; // 0=なし, 1=あり
  session_key: number;
  track_temperature: number; // 摂氏
  wind_direction: number; // 度
  wind_speed: number; // m/s
}

export interface WeatherParams {
  session_key?: number;
}

// ========== エラー ==========

export interface ApiError {
  message: string;
  status: number;
  endpoint: string;
  timestamp: string;
}
```

---

## 5. HTTPクライアント実装

### 5.1 基本設定

```typescript
// src/lib/api/client.ts

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

const BASE_URL = 'https://api.openf1.org/v1';

// Axiosインスタンス作成
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30秒
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター
apiClient.interceptors.request.use(
  (config) => {
    // リクエストログ（開発環境のみ）
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.params);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター
apiClient.interceptors.response.use(
  (response) => {
    // レスポンスログ（開発環境のみ）
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Response] ${response.config.url}`, response.data);
    }
    return response;
  },
  (error: AxiosError) => {
    // エラーハンドリング
    const apiError: ApiError = {
      message: error.message || 'Unknown error occurred',
      status: error.response?.status || 500,
      endpoint: error.config?.url || 'unknown',
      timestamp: new Date().toISOString(),
    };

    // エラーログ
    console.error('[API Error]', apiError);

    // ユーザー向けエラーメッセージの整形
    if (error.code === 'ECONNABORTED') {
      apiError.message = 'リクエストがタイムアウトしました';
    } else if (error.response?.status === 404) {
      apiError.message = 'データが見つかりません';
    } else if (error.response?.status === 429) {
      apiError.message = 'リクエスト制限に達しました。しばらくお待ちください';
    } else if (error.response?.status >= 500) {
      apiError.message = 'サーバーエラーが発生しました';
    }

    return Promise.reject(apiError);
  }
);

// 汎用GETリクエスト
export async function get<T>(
  endpoint: string,
  params?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.get<T>(endpoint, { params, ...config });
  return response.data;
}

// 汎用POSTリクエスト（将来の拡張用）
export async function post<T>(
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.post<T>(endpoint, data, config);
  return response.data;
}
```

---

## 6. APIサービス実装

### 6.1 セッションAPI

```typescript
// src/lib/api/f1/sessions.ts

import { get } from '../client';
import { Session, SessionsParams } from '../types';

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
    const sessions = await get<Session[]>('/sessions', { session_key: sessionKey });
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
   */
  async getAvailableYears(): Promise<number[]> {
    const sessions = await get<Session[]>('/sessions');
    const years = [...new Set(sessions.map(s => s.year))];
    return years.sort((a, b) => b - a); // 降順
  },
};
```

### 6.2 ミーティングAPI

```typescript
// src/lib/api/f1/meetings.ts

import { get } from '../client';
import { Meeting, MeetingsParams } from '../types';

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
    const meetings = await get<Meeting[]>('/meetings', { meeting_key: meetingKey });
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
    return meetings.sort((a, b) =>
      new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
    );
  },
};
```

### 6.3 ドライバーAPI

```typescript
// src/lib/api/f1/drivers.ts

import { get } from '../client';
import { Driver, DriversParams } from '../types';

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
    const drivers = await get<Driver[]>('/drivers', { session_key: sessionKey });
    // ドライバー番号順にソート
    return drivers.sort((a, b) => a.driver_number - b.driver_number);
  },

  /**
   * 特定のドライバーを取得
   */
  async getDriver(sessionKey: number, driverNumber: number): Promise<Driver> {
    const drivers = await get<Driver[]>('/drivers', {
      session_key: sessionKey,
      driver_number: driverNumber
    });
    if (drivers.length === 0) {
      throw new Error(`Driver not found: ${driverNumber} in session ${sessionKey}`);
    }
    return drivers[0];
  },
};
```

### 6.4 ラップタイムAPI

```typescript
// src/lib/api/f1/laps.ts

import { get } from '../client';
import { Lap, LapsParams } from '../types';

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
  async getLapsByDriver(sessionKey: number, driverNumber: number): Promise<Lap[]> {
    const laps = await get<Lap[]>('/laps', {
      session_key: sessionKey,
      driver_number: driverNumber
    });
    // ラップ番号順にソート
    return laps.sort((a, b) => a.lap_number - b.lap_number);
  },

  /**
   * ベストラップを取得（セッション全体）
   */
  async getBestLap(sessionKey: number): Promise<Lap | null> {
    const laps = await get<Lap[]>('/laps', { session_key: sessionKey });
    const validLaps = laps.filter(lap => lap.lap_duration !== null && !lap.is_pit_out_lap);
    if (validLaps.length === 0) return null;

    return validLaps.reduce((best, current) =>
      current.lap_duration! < best.lap_duration! ? current : best
    );
  },

  /**
   * ドライバー別ベストラップを取得
   */
  async getBestLapByDriver(sessionKey: number, driverNumber: number): Promise<Lap | null> {
    const laps = await this.getLapsByDriver(sessionKey, driverNumber);
    const validLaps = laps.filter(lap => lap.lap_duration !== null && !lap.is_pit_out_lap);
    if (validLaps.length === 0) return null;

    return validLaps.reduce((best, current) =>
      current.lap_duration! < best.lap_duration! ? current : best
    );
  },
};
```

### 6.5 ピットストップAPI

```typescript
// src/lib/api/f1/pit.ts

import { get } from '../client';
import { PitStop, PitStopsParams } from '../types';

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
    const pitStops = await get<PitStop[]>('/pit', { session_key: sessionKey });
    // 時刻順にソート
    return pitStops.sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  },

  /**
   * 特定ドライバーのピットストップを取得
   */
  async getPitStopsByDriver(sessionKey: number, driverNumber: number): Promise<PitStop[]> {
    const pitStops = await get<PitStop[]>('/pit', {
      session_key: sessionKey,
      driver_number: driverNumber
    });
    return pitStops.sort((a, b) => a.lap_number - b.lap_number);
  },
};
```

### 6.6 その他のAPI

```typescript
// src/lib/api/f1/position.ts
import { get } from '../client';
import { Position, PositionsParams } from '../types';

export const positionsApi = {
  async getPositions(params?: PositionsParams): Promise<Position[]> {
    return get<Position[]>('/position', params);
  },
  async getPositionsBySession(sessionKey: number): Promise<Position[]> {
    return get<Position[]>('/position', { session_key: sessionKey });
  },
};

// src/lib/api/f1/intervals.ts
import { get } from '../client';
import { Interval, IntervalsParams } from '../types';

export const intervalsApi = {
  async getIntervals(params?: IntervalsParams): Promise<Interval[]> {
    return get<Interval[]>('/intervals', params);
  },
  async getIntervalsBySession(sessionKey: number): Promise<Interval[]> {
    return get<Interval[]>('/intervals', { session_key: sessionKey });
  },
};

// src/lib/api/f1/stints.ts
import { get } from '../client';
import { Stint, StintsParams } from '../types';

export const stintsApi = {
  async getStints(params?: StintsParams): Promise<Stint[]> {
    return get<Stint[]>('/stints', params);
  },
  async getStintsBySession(sessionKey: number): Promise<Stint[]> {
    return get<Stint[]>('/stints', { session_key: sessionKey });
  },
};

// src/lib/api/f1/weather.ts
import { get } from '../client';
import { Weather, WeatherParams } from '../types';

export const weatherApi = {
  async getWeather(params?: WeatherParams): Promise<Weather[]> {
    return get<Weather[]>('/weather', params);
  },
  async getWeatherBySession(sessionKey: number): Promise<Weather[]> {
    return get<Weather[]>('/weather', { session_key: sessionKey });
  },
};

// src/lib/api/f1/car-data.ts
import { get } from '../client';
import { CarData, CarDataParams } from '../types';

export const carDataApi = {
  async getCarData(params?: CarDataParams): Promise<CarData[]> {
    return get<CarData[]>('/car_data', params);
  },
  // 注意: カーデータは大量になる可能性があるため、適切なフィルタリング必須
};
```

### 6.7 統合エクスポート

```typescript
// src/lib/api/f1/index.ts

export { sessionsApi } from './sessions';
export { meetingsApi } from './meetings';
export { driversApi } from './drivers';
export { lapsApi } from './laps';
export { pitApi } from './pit';
export { positionsApi } from './position';
export { intervalsApi } from './intervals';
export { stintsApi } from './stints';
export { weatherApi } from './weather';
export { carDataApi } from './car-data';

export * from '../types';

// 統合APIオブジェクト
export const f1Api = {
  sessions: sessionsApi,
  meetings: meetingsApi,
  drivers: driversApi,
  laps: lapsApi,
  pit: pitApi,
  positions: positionsApi,
  intervals: intervalsApi,
  stints: stintsApi,
  weather: weatherApi,
  carData: carDataApi,
};
```

---

## 7. データフェッチフック（SWR/React Query）

### 7.1 SWR実装例

```typescript
// src/lib/hooks/useF1Data.ts

import useSWR, { SWRConfiguration } from 'swr';
import { f1Api } from '../api/f1';

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
};

// セッション一覧フック
export function useSessions(year?: number) {
  return useSWR(
    year ? ['sessions', year] : null,
    () => f1Api.sessions.getSessionsByYear(year!),
    defaultConfig
  );
}

// ミーティング一覧フック
export function useMeetings(year: number) {
  return useSWR(
    ['meetings', year],
    () => f1Api.meetings.getMeetingsByYear(year),
    defaultConfig
  );
}

// ドライバー一覧フック
export function useDrivers(sessionKey?: number) {
  return useSWR(
    sessionKey ? ['drivers', sessionKey] : null,
    () => f1Api.drivers.getDriversBySession(sessionKey!),
    defaultConfig
  );
}

// ラップタイムフック
export function useLaps(sessionKey?: number, driverNumber?: number) {
  return useSWR(
    sessionKey && driverNumber ? ['laps', sessionKey, driverNumber] : null,
    () => f1Api.laps.getLapsByDriver(sessionKey!, driverNumber!),
    defaultConfig
  );
}

// セッション内全ラップタイムフック
export function useSessionLaps(sessionKey?: number) {
  return useSWR(
    sessionKey ? ['session-laps', sessionKey] : null,
    () => f1Api.laps.getLapsBySession(sessionKey!),
    {
      ...defaultConfig,
      dedupingInterval: 10000, // 大量データのため重複排除期間を長く
    }
  );
}

// ピットストップフック
export function usePitStops(sessionKey?: number) {
  return useSWR(
    sessionKey ? ['pit-stops', sessionKey] : null,
    () => f1Api.pit.getPitStopsBySession(sessionKey!),
    defaultConfig
  );
}

// ポジションフック
export function usePositions(sessionKey?: number) {
  return useSWR(
    sessionKey ? ['positions', sessionKey] : null,
    () => f1Api.positions.getPositionsBySession(sessionKey!),
    defaultConfig
  );
}

// スティントフック
export function useStints(sessionKey?: number) {
  return useSWR(
    sessionKey ? ['stints', sessionKey] : null,
    () => f1Api.stints.getStintsBySession(sessionKey!),
    defaultConfig
  );
}

// 天候フック
export function useWeather(sessionKey?: number) {
  return useSWR(
    sessionKey ? ['weather', sessionKey] : null,
    () => f1Api.weather.getWeatherBySession(sessionKey!),
    defaultConfig
  );
}
```

### 7.2 React Query実装例（代替案）

```typescript
// src/lib/hooks/useF1Data.ts (React Query版)

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { f1Api } from '../api/f1';

const defaultOptions = {
  staleTime: 5 * 60 * 1000, // 5分
  cacheTime: 10 * 60 * 1000, // 10分
  refetchOnWindowFocus: false,
};

export function useSessions(year?: number) {
  return useQuery({
    queryKey: ['sessions', year],
    queryFn: () => year ? f1Api.sessions.getSessionsByYear(year) : f1Api.sessions.getSessions(),
    enabled: !!year,
    ...defaultOptions,
  });
}

export function useDrivers(sessionKey?: number) {
  return useQuery({
    queryKey: ['drivers', sessionKey],
    queryFn: () => f1Api.drivers.getDriversBySession(sessionKey!),
    enabled: !!sessionKey,
    ...defaultOptions,
  });
}

// その他同様...
```

---

## 8. キャッシュ戦略

### 8.1 キャッシュレベル

```typescript
// src/utils/cache.ts

export const CACHE_STRATEGIES = {
  // 静的データ（長期キャッシュ）
  STATIC: {
    staleTime: 24 * 60 * 60 * 1000, // 24時間
    cacheTime: 7 * 24 * 60 * 60 * 1000, // 7日間
  },
  // セッション終了後データ（中期キャッシュ）
  COMPLETED_SESSION: {
    staleTime: 60 * 60 * 1000, // 1時間
    cacheTime: 24 * 60 * 60 * 1000, // 24時間
  },
  // 進行中セッション（短期キャッシュ）
  LIVE_SESSION: {
    staleTime: 30 * 1000, // 30秒
    cacheTime: 5 * 60 * 1000, // 5分
  },
  // 頻繁に変更されるデータ
  REALTIME: {
    staleTime: 10 * 1000, // 10秒
    cacheTime: 60 * 1000, // 1分
  },
};

// セッション状態に応じたキャッシュ設定
export function getCacheConfig(sessionEndDate: string) {
  const now = new Date();
  const endDate = new Date(sessionEndDate);

  if (endDate < now) {
    // セッション終了
    return CACHE_STRATEGIES.COMPLETED_SESSION;
  } else if (endDate.getTime() - now.getTime() < 4 * 60 * 60 * 1000) {
    // 4時間以内に終了予定（進行中とみなす）
    return CACHE_STRATEGIES.LIVE_SESSION;
  } else {
    // 未来のセッション
    return CACHE_STRATEGIES.STATIC;
  }
}
```

### 8.2 ブラウザキャッシュ
- Service Workerによるオフライン対応（将来実装）
- LocalStorageでのお気に入り設定保存

---

## 9. エラーハンドリング

### 9.1 エラー処理ユーティリティ

```typescript
// src/utils/error.ts

import { ApiError } from '@/lib/api/types';

export function handleApiError(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '不明なエラーが発生しました';
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'status' in error
  );
}

export class F1DataError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'F1DataError';
  }
}
```

---

## 10. テスト戦略

### 10.1 ユニットテスト

```typescript
// src/lib/api/f1/__tests__/sessions.test.ts

import { sessionsApi } from '../sessions';
import { apiClient } from '../../client';

jest.mock('../../client');

describe('sessionsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSessions', () => {
    it('should fetch sessions successfully', async () => {
      const mockData = [{ session_key: 1, session_name: 'Race', year: 2024 }];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await sessionsApi.getSessions({ year: 2024 });

      expect(result).toEqual(mockData);
      expect(apiClient.get).toHaveBeenCalledWith('/sessions', { params: { year: 2024 } });
    });

    it('should handle errors', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(sessionsApi.getSessions()).rejects.toThrow('Network error');
    });
  });
});
```

### 10.2 統合テスト
- 実際のAPIエンドポイントへのリクエストテスト
- モックサーバー（MSW）の使用

---

## 11. パフォーマンス最適化

### 11.1 データ圧縮
- 大量データ取得時のgzip圧縮リクエスト

### 11.2 リクエストバッチング
- 複数ドライバーのデータを一括取得

### 11.3 増分ロード
- 初回は最小限のデータ
- スクロール/操作に応じて追加データ取得

---

## 12. 監視・ロギング

### 12.1 APIメトリクス
- リクエスト数
- レスポンスタイム
- エラー率

### 12.2 ログ出力
- 開発環境: コンソールログ
- 本番環境: 外部ログサービス（Sentry等）

---

## 13. 環境変数

```bash
# .env.local

# API設定
NEXT_PUBLIC_F1_API_BASE_URL=https://api.openf1.org/v1
NEXT_PUBLIC_F1_API_TIMEOUT=30000

# キャッシュ設定
NEXT_PUBLIC_CACHE_ENABLED=true
NEXT_PUBLIC_CACHE_TTL=300000

# 開発設定
NEXT_PUBLIC_ENABLE_API_LOGS=true
```

---

## 14. 今後の拡張

- WebSocket対応（リアルタイムデータ）
- GraphQL対応検討
- データプリフェッチ戦略
- Offline-First対応
