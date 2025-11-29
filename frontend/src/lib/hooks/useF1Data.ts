import { useQuery, useQueries } from '@tanstack/react-query';
import { f1Api } from '@/lib/api/f1';
import { useFastF1Laps, useFastF1SessionLaps, useFastF1MultipleDriversLaps, useFastF1Telemetry } from './useFastF1Data';

const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5分
const DEFAULT_GC_TIME = 10 * 60 * 1000; // 10分

// Feature flag: Set to true to use FastF1 backend for lap data
const USE_FASTF1_FOR_LAPS = import.meta.env.VITE_USE_FASTF1 === 'true';

// セッション一覧フック
export function useSessions(year?: number) {
  return useQuery({
    queryKey: ['sessions', year],
    queryFn: () =>
      year
        ? f1Api.sessions.getSessionsByYear(year)
        : f1Api.sessions.getSessions(),
    enabled: !!year,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

// 特定セッション取得フック
export function useSession(sessionKey?: number) {
  return useQuery({
    queryKey: ['session', sessionKey],
    queryFn: () => f1Api.sessions.getSession(sessionKey!),
    enabled: !!sessionKey,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

// 利用可能な年度一覧フック
export function useAvailableYears() {
  return useQuery({
    queryKey: ['availableYears'],
    queryFn: () => f1Api.sessions.getAvailableYears(),
    staleTime: 24 * 60 * 60 * 1000, // 24時間（静的データ）
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7日間
  });
}

// ミーティング一覧フック
export function useMeetings(year: number) {
  return useQuery({
    queryKey: ['meetings', year],
    queryFn: () => f1Api.meetings.getMeetingsByYear(year),
    enabled: !!year,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

// 特定ミーティング取得フック
export function useMeeting(meetingKey?: number) {
  return useQuery({
    queryKey: ['meeting', meetingKey],
    queryFn: () => f1Api.meetings.getMeeting(meetingKey!),
    enabled: !!meetingKey,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

// ドライバー一覧フック
export function useDrivers(sessionKey?: number) {
  return useQuery({
    queryKey: ['drivers', sessionKey],
    queryFn: () => f1Api.drivers.getDriversBySession(sessionKey!),
    enabled: !!sessionKey,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

// 特定ドライバー取得フック
export function useDriver(sessionKey?: number, driverNumber?: number) {
  return useQuery({
    queryKey: ['driver', sessionKey, driverNumber],
    queryFn: () => f1Api.drivers.getDriver(sessionKey!, driverNumber!),
    enabled: !!sessionKey && !!driverNumber,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

// ラップタイムフック（ドライバー別） - FastF1対応
export function useLaps(sessionKey?: number, driverNumber?: number) {
  // Feature flag: Use FastF1 if enabled
  if (USE_FASTF1_FOR_LAPS) {
    console.log('[useLaps] 🚀 USING FastF1 API', { sessionKey, driverNumber });
    return useFastF1Laps(sessionKey, driverNumber);
  }

  // Default: Use OpenF1
  console.log('[useLaps] 📡 USING OpenF1 API', { sessionKey, driverNumber });
  return useQuery({
    queryKey: ['laps', sessionKey, driverNumber],
    queryFn: () => f1Api.laps.getLapsByDriver(sessionKey!, driverNumber!),
    enabled: !!sessionKey && !!driverNumber,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

// セッション内全ラップタイムフック - FastF1対応
export function useSessionLaps(sessionKey?: number) {
  // Feature flag: Use FastF1 if enabled
  if (USE_FASTF1_FOR_LAPS) {
    console.log('[useSessionLaps] 🚀 USING FastF1 API', { sessionKey });
    return useFastF1SessionLaps(sessionKey);
  }

  // Default: Use OpenF1
  console.log('[useSessionLaps] 📡 USING OpenF1 API', { sessionKey });
  return useQuery({
    queryKey: ['sessionLaps', sessionKey],
    queryFn: () => f1Api.laps.getLapsBySession(sessionKey!),
    enabled: !!sessionKey,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

// ベストラップフック
export function useBestLap(sessionKey?: number) {
  return useQuery({
    queryKey: ['bestLap', sessionKey],
    queryFn: () => f1Api.laps.getBestLap(sessionKey!),
    enabled: !!sessionKey,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

// ピットストップフック
export function usePitStops(sessionKey?: number) {
  return useQuery({
    queryKey: ['pitStops', sessionKey],
    queryFn: () => f1Api.pit.getPitStopsBySession(sessionKey!),
    enabled: !!sessionKey,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

// ドライバー別ピットストップフック
export function usePitStopsByDriver(sessionKey?: number, driverNumber?: number) {
  return useQuery({
    queryKey: ['pitStops', sessionKey, driverNumber],
    queryFn: () => f1Api.pit.getPitStopsByDriver(sessionKey!, driverNumber!),
    enabled: !!sessionKey && !!driverNumber,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

// ポジションフック
export function usePositions(sessionKey?: number) {
  return useQuery({
    queryKey: ['positions', sessionKey],
    queryFn: () => f1Api.positions.getPositionsBySession(sessionKey!),
    enabled: !!sessionKey,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

// スティントフック
export function useStints(sessionKey?: number) {
  return useQuery({
    queryKey: ['stints', sessionKey],
    queryFn: () => f1Api.stints.getStintsBySession(sessionKey!),
    enabled: !!sessionKey,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

// ドライバー別スティントフック
export function useStintsByDriver(sessionKey?: number, driverNumber?: number) {
  return useQuery({
    queryKey: ['stints', sessionKey, driverNumber],
    queryFn: () => f1Api.stints.getStintsByDriver(sessionKey!, driverNumber!),
    enabled: !!sessionKey && !!driverNumber,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

// 複数ドライバーのラップタイムを取得するhook
export function useMultipleDriversLaps(
  sessionKey?: number,
  driverNumbers?: number[],
) {
  // Feature flag: Use FastF1 if enabled
  if (USE_FASTF1_FOR_LAPS) {
    console.log('[useMultipleDriversLaps] 🚀 USING FastF1 API', { sessionKey, driverNumbers });
    // Note: We need to import useFastF1MultipleDriversLaps at the top or use it here
    // Since we can't easily change imports in this tool without replacing the whole file, 
    // I will assume it is imported or I will use the hook logic directly if needed, 
    // but better to use the hook from useFastF1Data.ts
    // Wait, I need to make sure it's imported.
    // Let's check imports first.
    return useFastF1MultipleDriversLaps(sessionKey, driverNumbers);
  }

  console.log('[useMultipleDriversLaps] 📡 USING OpenF1 API', { sessionKey, driverNumbers });
  const queries = useQueries({
    queries: (driverNumbers || []).map((driverNumber) => ({
      queryKey: ['laps', sessionKey, driverNumber],
      queryFn: () => f1Api.laps.getLapsByDriver(sessionKey!, driverNumber),
      enabled: !!sessionKey,
      staleTime: DEFAULT_STALE_TIME,
      gcTime: DEFAULT_GC_TIME,
    })),
  });

  // すべてのクエリの結果を1つの配列にまとめる
  const allLaps = queries.flatMap((query) => query.data || []);
  const isLoading = queries.some((query) => query.isLoading);
  const error = queries.find((query) => query.error)?.error;

  return {
    data: allLaps.length > 0 ? allLaps : undefined,
    isLoading,
    error: error as Error | null,
  };
}

// レースコントロール（フラッグ情報）フック
export function useRaceControl(sessionKey?: number) {
  return useQuery({
    queryKey: ['raceControl', sessionKey],
    queryFn: () => f1Api.raceControl.getRaceControl({ session_key: sessionKey }),
    enabled: !!sessionKey,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

// フラッグ情報のみ取得するフック
export function useFlags(sessionKey?: number) {
  return useQuery({
    queryKey: ['flags', sessionKey],
    queryFn: () => f1Api.raceControl.getFlags(sessionKey!),
    enabled: !!sessionKey,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}
// カーテレメトリーフック
export function useCarData(sessionKey?: number, driverNumber?: number, lapStartDate?: string, lapNumber?: number) {
  // Feature flag: Use FastF1 if enabled
  if (USE_FASTF1_FOR_LAPS) {
    console.log('[useCarData] 🚀 USING FastF1 API', { sessionKey, driverNumber, lapNumber });
    // Note: FastF1 needs lapNumber, OpenF1 needs lapStartDate (to calculate range)
    // If lapNumber is missing but we have FastF1 enabled, we might have an issue unless we can derive it.
    // But RaceAnalysis should pass it.
    return useFastF1Telemetry(sessionKey, driverNumber, lapNumber);
  }

  console.log('[useCarData] 📡 USING OpenF1 API', { sessionKey, driverNumber, lapStartDate });

  // ラップの開始時刻が指定されている場合、そのラップのデータのみを取得
  // 1ラップは通常90-120秒程度なので、date>=とdate<=で絞り込む
  const params: any = {
    session_key: sessionKey,
    driver_number: driverNumber,
  };

  if (lapStartDate) {
    // ラップ開始時刻から150秒後までのデータを取得（余裕を持たせる）
    const startDate = new Date(lapStartDate);
    const endDate = new Date(startDate.getTime() + 150 * 1000);
    // OpenF1 APIは date>= と date<= という形式のパラメータを使用
    params['date>='] = startDate.toISOString();
    params['date<='] = endDate.toISOString();
    console.log('[useCarData] Date range:', {
      lapStartDate,
      'date>=': params['date>='],
      'date<=': params['date<=']
    });
  }

  return useQuery({
    queryKey: ['carData', sessionKey, driverNumber, lapStartDate],
    queryFn: () => {
      console.log('[useCarData] Fetching car_data with params:', params);
      return f1Api.carData.getCarData(params);
    },
    enabled: !!sessionKey && !!driverNumber && !!lapStartDate, // ラップが選択されている場合のみ実行
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

// 位置情報フック
export function useLocation(sessionKey?: number, driverNumber?: number) {
  return useQuery({
    queryKey: ['location', sessionKey, driverNumber],
    queryFn: () => f1Api.location.getLocation({ session_key: sessionKey, driver_number: driverNumber }),
    enabled: !!sessionKey && !!driverNumber,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

