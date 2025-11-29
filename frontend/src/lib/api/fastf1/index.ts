import { getFastF1 } from './client';
import type {
    FastF1Session,
    FastF1Lap,
    FastF1TelemetryPoint,
    FastF1GapData,
    FastF1Driver,
} from './types';

/**
 * Fetch all sessions for a given year
 */
export async function fetchSessions(year: number): Promise<FastF1Session[]> {
    return getFastF1<FastF1Session[]>(`/api/sessions/${year}`);
}

/**
 * Fetch laps for a specific session and driver(s)
 */
export async function fetchLaps(params: {
    session_key: number;
    driver_number?: number;
}): Promise<FastF1Lap[]> {
    return getFastF1<FastF1Lap[]>('/api/laps', params);
}

/**
 * Fetch telemetry data for a specific lap
 */
export async function fetchTelemetry(params: {
    session_key: number;
    driver_number: number;
    lap_number: number;
}): Promise<FastF1TelemetryPoint[]> {
    return getFastF1<FastF1TelemetryPoint[]>('/api/telemetry', params);
}

/**
 * Fetch gap analysis data
 */
export async function fetchGapAnalysis(params: {
    session_key: number;
    driver_numbers: number[]; // Array of driver numbers
}): Promise<FastF1GapData[]> {
    return getFastF1<FastF1GapData[]>('/api/analysis/gap', {
        ...params,
        driver_numbers: params.driver_numbers.join(','),
    });
}

/**
 * Fetch driver information for a session
 */
export async function fetchDrivers(session_key: number): Promise<FastF1Driver[]> {
    return getFastF1<FastF1Driver[]>('/api/drivers', { session_key });
}
