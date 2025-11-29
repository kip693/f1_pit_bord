import type { FastF1Lap, FastF1TelemetryPoint } from './types';
import type { Lap, CarData } from '../types';

/**
 * Convert FastF1Lap to OpenF1 Lap format
 * This allows FastF1 data to work with existing analysis functions
 */
export function adaptFastF1LapToLap(fastF1Lap: FastF1Lap): Lap {
    return {
        date_start: fastF1Lap.date_start || '',
        driver_number: fastF1Lap.driver_number,
        duration_sector_1: fastF1Lap.duration_sector_1,
        duration_sector_2: fastF1Lap.duration_sector_2,
        duration_sector_3: fastF1Lap.duration_sector_3,
        i1_speed: fastF1Lap.i1_speed,
        i2_speed: fastF1Lap.i2_speed,
        is_pit_out_lap: fastF1Lap.is_pit_out_lap,
        lap_duration: fastF1Lap.lap_duration,
        lap_number: fastF1Lap.lap_number,
        meeting_key: fastF1Lap.meeting_key,
        session_key: fastF1Lap.session_key,
        st_speed: fastF1Lap.st_speed,
        total_seconds: fastF1Lap.total_seconds,
        // FastF1 doesn't provide segment data, use empty arrays
        segments_sector_1: [],
        segments_sector_2: [],
        segments_sector_3: [],
    };
}

/**
 * Convert array of FastF1Laps to Laps
 */
export function adaptFastF1Laps(fastF1Laps: FastF1Lap[]): Lap[] {
    return fastF1Laps.map(adaptFastF1LapToLap);
}

/**
 * Convert FastF1TelemetryPoint to OpenF1 CarData format
 */
export function adaptFastF1Telemetry(
    points: FastF1TelemetryPoint[],
    sessionKey: number,
    driverNumber: number
): CarData[] {
    return points.map(point => ({
        brake: point.brake ? 100 : 0, // FastF1 is boolean, OpenF1 is usually 0 or 100 for brake application
        date: point.date,
        driver_number: driverNumber,
        drs: point.drs,
        meeting_key: 0, // Not available in telemetry point, but not critical for chart
        n_gear: point.gear,
        rpm: point.rpm,
        session_key: sessionKey,
        speed: point.speed,
        throttle: point.throttle,
    }));
}
