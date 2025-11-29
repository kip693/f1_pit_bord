// ========== 共通型 ==========

export interface ApiError {
  message: string;
  status: number;
  endpoint: string;
  timestamp: string;
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
  date_start: string;
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
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  i1_speed: number | null;
  i2_speed: number | null;
  is_pit_out_lap: boolean;
  lap_duration: number | null;
  lap_number: number;
  meeting_key: number;
  session_key: number;
  st_speed: number | null;
  segments_sector_1: number[];
  segments_sector_2: number[];
  segments_sector_3: number[];
  total_seconds?: number | null; // cumulative session time (FastF1 specific)
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
  pit_duration: number;
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
  gap_to_leader: number | null;
  interval: number | null;
  meeting_key: number;
  session_key: number;
}

export interface IntervalsParams {
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
  air_temperature: number;
  date: string;
  humidity: number;
  meeting_key: number;
  pressure: number;
  rainfall: number;
  session_key: number;
  track_temperature: number;
  wind_direction: number;
  wind_speed: number;
}

export interface WeatherParams {
  session_key?: number;
}

// ========== カーテレメトリー ==========

export interface CarData {
  brake: number;
  date: string;
  driver_number: number;
  drs: number;
  meeting_key: number;
  n_gear: number;
  rpm: number;
  session_key: number;
  speed: number;
  throttle: number;
}

export interface CarDataParams {
  session_key?: number;
  driver_number?: number;
  speed_gte?: number;
  speed_lte?: number;
}

// ========== レースコントロール（フラッグなど） ==========

export type FlagType =
  | 'GREEN'
  | 'YELLOW'
  | 'DOUBLE YELLOW'
  | 'RED'
  | 'BLUE'
  | 'BLACK AND WHITE'
  | 'BLACK'
  | 'CHEQUERED'
  | 'CLEAR'
  | 'SC'
  | 'VSC'
  | null;

export interface RaceControl {
  date: string;
  driver_number: number | null;
  lap_number: number | null;
  meeting_key: number;
  session_key: number;
  category: string; // "Flag", "SafetyCar", "Other" など
  flag: FlagType;
  scope: 'Track' | 'Driver' | 'Sector' | null;
  sector: number | null;
  message: string;
}

export interface RaceControlParams {
  session_key?: number;
  driver_number?: number;
  flag?: FlagType;
  category?: string;
  date_gte?: string;
  date_lte?: string;
}
// ========== ロケーション（位置情報） ==========

export interface Location {
  date: string;
  driver_number: number;
  meeting_key: number;
  session_key: number;
  x: number;
  y: number;
  z: number;
}

export interface LocationParams {
  session_key?: number;
  driver_number?: number;
  date_gte?: string;
  date_lte?: string;
}
