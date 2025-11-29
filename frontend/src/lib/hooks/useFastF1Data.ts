import { useQuery, useQueries } from '@tanstack/react-query';
import { fetchLaps, fetchTelemetry, fetchDrivers } from '@/lib/api/fastf1';
import { adaptFastF1Laps, adaptFastF1Telemetry } from '@/lib/api/fastf1/adapters';
import type { Lap } from '@/lib/api/types';

const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5分
const DEFAULT_GC_TIME = 10 * 60 * 1000; // 10分

/**
 * FastF1: Fetch laps for a specific driver
 * Returns data in OpenF1 Lap format for compatibility
 */
export function useFastF1Laps(sessionKey?: number, driverNumber?: number) {
    return useQuery({
        queryKey: ['fastf1-laps', sessionKey, driverNumber],
        queryFn: async () => {
            console.log('[FastF1] 🔄 Fetching laps from FastF1 backend...', { sessionKey, driverNumber });
            const fastF1Laps = await fetchLaps({
                session_key: sessionKey!,
                driver_number: driverNumber,
            });
            console.log('[FastF1] ✅ Received', fastF1Laps.length, 'laps from FastF1 backend');
            const adaptedLaps = adaptFastF1Laps(fastF1Laps);
            console.log('[FastF1] 🔄 Adapted to OpenF1 format');
            return adaptedLaps;
        },
        enabled: !!sessionKey && !!driverNumber,
        staleTime: DEFAULT_STALE_TIME,
        gcTime: DEFAULT_GC_TIME,
    });
}

/**
 * FastF1: Fetch all laps for a session
 * Returns data in OpenF1 Lap format for compatibility
 */
export function useFastF1SessionLaps(sessionKey?: number) {
    return useQuery({
        queryKey: ['fastf1-session-laps', sessionKey],
        queryFn: async () => {
            console.log('[FastF1] 🔄 Fetching session laps from FastF1 backend...', { sessionKey });
            const fastF1Laps = await fetchLaps({
                session_key: sessionKey!,
            });
            console.log('[FastF1] ✅ Received', fastF1Laps.length, 'laps from FastF1 backend');
            const adaptedLaps = adaptFastF1Laps(fastF1Laps);
            console.log('[FastF1] 🔄 Adapted to OpenF1 format');
            return adaptedLaps;
        },
        enabled: !!sessionKey,
        staleTime: DEFAULT_STALE_TIME,
        gcTime: DEFAULT_GC_TIME,
    });
}

/**
 * FastF1: Fetch laps for multiple drivers
 * Returns data in OpenF1 Lap format for compatibility
 */
export function useFastF1MultipleDriversLaps(
    sessionKey?: number,
    driverNumbers?: number[],
) {
    const queries = useQueries({
        queries: (driverNumbers || []).map((driverNumber) => ({
            queryKey: ['fastf1-laps', sessionKey, driverNumber],
            queryFn: async () => {
                const fastF1Laps = await fetchLaps({
                    session_key: sessionKey!,
                    driver_number: driverNumber,
                });
                return adaptFastF1Laps(fastF1Laps);
            },
            enabled: !!sessionKey,
            staleTime: DEFAULT_STALE_TIME,
            gcTime: DEFAULT_GC_TIME,
        })),
    });

    const allLaps: Lap[] = queries.flatMap((query) => query.data || []);
    const isLoading = queries.some((query) => query.isLoading);
    const error = queries.find((query) => query.error)?.error;

    return {
        data: allLaps.length > 0 ? allLaps : undefined,
        isLoading,
        error: error as Error | null,
    };
}

/**
 * FastF1: Fetch telemetry for a specific lap
 */
/**
 * FastF1: Fetch telemetry for a specific lap
 */
export function useFastF1Telemetry(
    sessionKey?: number,
    driverNumber?: number,
    lapNumber?: number,
) {
    return useQuery({
        queryKey: ['fastf1-telemetry', sessionKey, driverNumber, lapNumber],
        queryFn: async () => {
            const telemetry = await fetchTelemetry({
                session_key: sessionKey!,
                driver_number: driverNumber!,
                lap_number: lapNumber!,
            });
            // Adapt to OpenF1 format
            // We need to import adaptFastF1Telemetry first
            // Since I cannot change imports easily here, I will assume it is imported or add it to the top import if I could.
            // But I can't. So I will use the function from the module if I can import it.
            // I will update imports in a separate step or just assume I can update the whole file.
            // Let's rely on the previous step where I updated imports in useF1Data.ts, but this is useFastF1Data.ts
            // I need to update imports in this file too.
            return adaptFastF1Telemetry(telemetry, sessionKey!, driverNumber!);
        },
        enabled: !!sessionKey && !!driverNumber && !!lapNumber,
        staleTime: DEFAULT_STALE_TIME,
        gcTime: DEFAULT_GC_TIME,
    });
}

/**
 * FastF1: Fetch drivers for a session
 */
export function useFastF1Drivers(sessionKey?: number) {
    return useQuery({
        queryKey: ['fastf1-drivers', sessionKey],
        queryFn: () => fetchDrivers(sessionKey!),
        enabled: !!sessionKey,
        staleTime: DEFAULT_STALE_TIME,
        gcTime: DEFAULT_GC_TIME,
    });
}
