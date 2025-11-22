import { useMemo } from 'react';
import {
    useDrivers,
    useMultipleDriversLaps,
    usePitStops,
    useStints,
    useFlags,
} from '@/lib/hooks/useF1Data';
import { LapTimeChart } from '@/components/charts/LapTimeChart';
import { PitStrategyTimeline } from '@/components/charts/PitStrategyTimeline';
import { TyreDegradationChart } from '@/components/charts/TyreDegradationChart';
import { Loading } from '@/components/common/Loading';
import { ErrorMessage } from '@/components/common/ErrorMessage';

interface RaceAnalysisProps {
    sessionKey: number;
    selectedDrivers: number[];
}

export function RaceAnalysis({ sessionKey, selectedDrivers }: RaceAnalysisProps) {
    // データフェッチング
    const { data: drivers, isLoading: driversLoading, error: driversError } = useDrivers(sessionKey);
    const { data: laps, isLoading: lapsLoading, error: lapsError } = useMultipleDriversLaps(
        sessionKey,
        selectedDrivers,
    );
    const { data: pitStops, isLoading: pitStopsLoading, error: pitStopsError } = usePitStops(sessionKey);
    const { data: stints, isLoading: stintsLoading, error: stintsError } = useStints(sessionKey);
    const { data: flags } = useFlags(sessionKey);

    // 最大ラップ数を計算
    const maxLap = useMemo(() => {
        if (!laps || laps.length === 0) return 70;
        return Math.max(...laps.map((l) => l.lap_number));
    }, [laps]);

    // ローディング状態
    const isLoading = driversLoading || lapsLoading || pitStopsLoading || stintsLoading;
    const error = driversError || lapsError || pitStopsError || stintsError;

    // ローディング中
    if (isLoading) {
        return <Loading />;
    }

    // エラー発生
    if (error) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <ErrorMessage message={error.message} />
            </div>
        );
    }

    // データが存在しない
    if (!drivers || !laps || !pitStops || !stints) {
        return <ErrorMessage message="データの取得に失敗しました" />;
    }

    return (
        <div className="space-y-8">
            {/* ページヘッダー */}
            <div className="border-b border-gray-200 pb-4">
                <h1 className="text-2xl font-bold text-gray-900">セッション分析</h1>
                <p className="mt-2 text-sm text-gray-600">
                    ラップタイム推移、ピット戦略、タイヤデグラデーションを分析
                </p>
            </div>

            {/* ラップタイム推移グラフ */}
            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">ラップタイム推移</h2>
                <LapTimeChart
                    laps={laps}
                    pitStops={pitStops}
                    drivers={drivers}
                    selectedDrivers={selectedDrivers}
                    flags={flags}
                />
            </section>

            {/* ピット戦略タイムライン */}
            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">ピット戦略タイムライン</h2>
                <PitStrategyTimeline
                    stints={stints}
                    drivers={drivers}
                    selectedDrivers={selectedDrivers}
                    maxLap={maxLap}
                />
            </section>

            {/* タイヤデグラデーション分析 */}
            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    タイヤデグラデーション分析
                </h2>
                <TyreDegradationChart
                    laps={laps}
                    stints={stints}
                    drivers={drivers}
                    selectedDrivers={selectedDrivers}
                />
            </section>
        </div>
    );
}
