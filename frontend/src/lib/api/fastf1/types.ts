// FastF1 Backend API Types

export interface FastF1Session {
    session_key: number;
    session_name: string;
    session_type: string;
    date_start: string;
    date_end: string;
    gmt_offset: string;
    meeting_key: number;
    location: string;
    country_name: string;
    country_code: string;
    circuit_key: number;
    circuit_short_name: string;
    year: number;
}

export interface FastF1Lap {
    meeting_key: number;
    session_key: number;
    driver_number: number;
    lap_number: number;
    lap_duration: number | null; // seconds
    duration_sector_1: number | null;
    duration_sector_2: number | null;
    duration_sector_3: number | null;
    compound: string | null;
    tyre_life: number | null;
    is_pit_out_lap: boolean;
    i1_speed: number | null;
    i2_speed: number | null;
    st_speed: number | null;
    date_start: string | null;
    total_seconds: number | null; // cumulative session time
}

export interface FastF1TelemetryPoint {
    date: string;
    speed: number;
    rpm: number;
    gear: number;
    throttle: number;
    brake: boolean;
    drs: number;
    distance: number;
    rel_distance: number; // 0.0 to 1.0
}

export interface FastF1GapData {
    lap_number: number;
    [key: `driver_${number}_gap`]: number | null;
    [key: `driver_${number}_cumulative`]: number | null;
}

export interface FastF1Driver {
    driver_number: number;
    name_acronym: string;
    full_name: string;
    team_name: string;
    team_colour: string;
}
