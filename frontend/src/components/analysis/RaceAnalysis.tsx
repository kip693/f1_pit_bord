import {
    useDrivers,
    useMultipleDriversLaps,
    usePitStops,
    useStints,
    useFlags,
    useCarData,
} from '@/lib/hooks/useF1Data';
import { LapTimeChart } from '@/components/charts/LapTimeChart';
import { PitStrategyTimeline } from '@/components/charts/PitStrategyTimeline';
import { TyreDegradationChart } from '@/components/charts/TyreDegradationChart';
import { SectorPerformanceTable } from '@/components/analysis/SectorPerformanceTable';
import { TelemetryChart } from '@/components/charts/TelemetryChart';
import { useMemo, useState, useEffect } from 'react';
import { Driver } from '@/lib/api/types';
import { Loading } from '@/components/common/Loading';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { ShareButton } from '@/components/common/ShareButton';
import { TrackMapComparison } from '@/components/analysis/TrackMapComparison';
import { useTranslation } from 'react-i18next';

interface RaceAnalysisProps {
    sessionKey: number;
    selectedDrivers: number[];
}

export function RaceAnalysis({ sessionKey, selectedDrivers }: RaceAnalysisProps) {
    const { t } = useTranslation();
    // データフェッチング
    const { data: drivers, isLoading: driversLoading, error: driversError } = useDrivers(sessionKey);
    const { data: laps, isLoading: lapsLoading, error: lapsError } = useMultipleDriversLaps(
        sessionKey,
        selectedDrivers,
    );

    // Debug: Check last laps data
    useEffect(() => {
        if (laps && laps.length > 0) {
            const maxLap = Math.max(...laps.map(l => l.lap_number));
            const lastLaps = laps.filter(l => l.lap_number >= maxLap - 2);
            console.log('[RaceAnalysis] Last 3 laps data:', lastLaps);

            // Check specifically for selected drivers
            selectedDrivers.forEach(driver => {
                const driverLaps = laps.filter(l => l.driver_number === driver && l.lap_number >= maxLap - 2);
                console.log(`[RaceAnalysis] Driver ${driver} last laps:`, driverLaps);
            });
        }
    }, [laps, selectedDrivers]);

    const { data: pitStops, isLoading: pitStopsLoading, error: pitStopsError } = usePitStops(sessionKey);
    const { data: stints, isLoading: stintsLoading, error: stintsError } = useStints(sessionKey);
    const { data: flags } = useFlags(sessionKey);

    console.log(pitStopsError)


    // テレメトリー分析用のステート
    const [telemetryDriver, setTelemetryDriver] = useState<number | null>(null);
    const [telemetryLap, setTelemetryLap] = useState<number | null>(null);

    // 2人目のドライバー用のステート
    const [telemetryDriver2, setTelemetryDriver2] = useState<number | null>(null);
    const [telemetryLap2, setTelemetryLap2] = useState<number | null>(null);

    // 系列の表示・非表示切り替え用のステート
    const [visibleSeries, setVisibleSeries] = useState({
        speed: true,
        rpm: false,
        throttle: true,
        brake: true,
        gear: false,
    });

    // 初期値設定（最初のドライバーのベストラップなど）
    useEffect(() => {
        if (selectedDrivers.length > 0 && !telemetryDriver) {
            setTelemetryDriver(selectedDrivers[0]);
        }
    }, [selectedDrivers, telemetryDriver]);

    // 選択されたラップのデータを取得して日付範囲を計算（ドライバー1）
    const selectedLapData = useMemo(() => {
        if (!laps || !telemetryDriver || !telemetryLap) return null;
        return laps.find(l => l.driver_number === telemetryDriver && l.lap_number === telemetryLap);
    }, [laps, telemetryDriver, telemetryLap]);

    // 選択されたラップのデータを取得して日付範囲を計算（ドライバー2）
    const selectedLapData2 = useMemo(() => {
        if (!laps || !telemetryDriver2 || !telemetryLap2) return null;
        return laps.find(l => l.driver_number === telemetryDriver2 && l.lap_number === telemetryLap2);
    }, [laps, telemetryDriver2, telemetryLap2]);

    // テレメトリーデータ取得（ドライバー1）
    const { data: carData, isLoading: carDataLoading } = useCarData(
        sessionKey,
        telemetryDriver ?? undefined,
        selectedLapData?.date_start,
        telemetryLap ?? undefined
    );

    // テレメトリーデータ取得（ドライバー2）
    const { data: carData2, isLoading: carDataLoading2 } = useCarData(
        sessionKey,
        telemetryDriver2 ?? undefined,
        selectedLapData2?.date_start,
        telemetryLap2 ?? undefined
    );

    // ベストラップを自動選択する関数
    const selectBestLap = (driverNum: number, isSecondDriver: boolean = false) => {
        if (!laps) return;
        const driverLaps = laps.filter(l => l.driver_number === driverNum && l.lap_duration);
        if (driverLaps.length === 0) return;

        const bestLap = driverLaps.reduce((best, current) => {
            return (current.lap_duration! < best.lap_duration!) ? current : best;
        });

        if (isSecondDriver) {
            setTelemetryLap2(bestLap.lap_number);
        } else {
            setTelemetryLap(bestLap.lap_number);
        }
    };

    // 最大ラップ数を計算
    const maxLap = useMemo(() => {
        if (!laps || laps.length === 0) return 70;
        return Math.max(...laps.map((l) => l.lap_number));
    }, [laps]);

    // ローディング状態
    // ドライバー情報は必須なのでグローバルローディングにする
    const isGlobalLoading = driversLoading;
    const globalError = driversError;

    // ローディング中
    if (isGlobalLoading) {
        return <Loading />;
    }

    // エラー発生
    if (globalError) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <ErrorMessage message={globalError.message} />
            </div>
        );
    }

    // データが存在しない
    if (!drivers) {
        return <ErrorMessage message="ドライバー情報の取得に失敗しました" />;
    }

    return (
        <div className="space-y-8">
            {/* ページヘッダー */}
            <div className="border-b border-gray-200 pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{t('analysis.pageTitle')}</h1>
                        <p className="mt-2 text-sm text-gray-600">{t('analysis.pageDescription')}</p>
                    </div>
                    <ShareButton
                        title={t('analysis.pageTitle')}
                        text={t('analysis.pageDescription')}
                    />
                </div>
            </div>

            {/* ラップタイム推移グラフ */}
            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('analysis.lapTimeProgression')}</h2>
                {lapsLoading || pitStopsLoading ? (
                    <div className="flex h-[450px] items-center justify-center flex-col">
                        <Loading color="blue" size="lg" />
                        <p className='text-gray-600 mt-3'>{t('analysis.loadingHint')}</p>
                    </div>
                ) : lapsError ? (
                    <ErrorMessage message={lapsError.message} />
                ) : (
                    <LapTimeChart
                        laps={laps || []}
                        pitStops={pitStops || []}
                        drivers={drivers}
                        selectedDrivers={selectedDrivers}
                        flags={flags}
                    />
                )}
            </section>

            {/* ピット戦略タイムライン */}
            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('analysis.pitStrategyTimeline')}</h2>
                {stintsLoading ? (
                    <div className="flex h-[200px] items-center justify-center">
                        <Loading />
                    </div>
                ) : stintsError ? (
                    <ErrorMessage message={stintsError.message} />
                ) : (
                    <PitStrategyTimeline
                        stints={stints || []}
                        drivers={drivers}
                        selectedDrivers={selectedDrivers}
                        maxLap={maxLap}
                    />
                )}
            </section>

            {/* タイヤデグラデーション分析 */}
            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    {t('analysis.tyreDegradation')}
                </h2>
                {lapsLoading || stintsLoading ? (
                    <div className="flex h-[400px] items-center justify-center">
                        <Loading />
                    </div>
                ) : (
                    <TyreDegradationChart
                        laps={laps || []}
                        stints={stints || []}
                        drivers={drivers}
                        selectedDrivers={selectedDrivers}
                    />
                )}
            </section>

            {/* トラックマップ：走行ライン比較 */}
            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-2 text-lg font-semibold text-gray-900">
                    {t('analysis.trackMapTitle')}
                </h2>
                <p className="mb-4 text-sm text-gray-600">
                    {t('analysis.trackMapDescription')}
                </p>
                {lapsLoading ? (
                    <div className="flex h-[400px] items-center justify-center">
                        <Loading />
                    </div>
                ) : (
                    <TrackMapComparison
                        sessionKey={sessionKey}
                        drivers={drivers || []}
                        laps={laps || []}
                        selectedDrivers={selectedDrivers}
                    />
                )}
            </section>

            {/* セクターパフォーマンス分析 */}
            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    {t('analysis.sectorPerformance')}
                </h2>
                <p className="mb-4 text-sm text-gray-600">
                    {t('analysis.sectorPerformanceDescription')}
                </p>
                {lapsLoading ? (
                    <div className="flex h-[300px] items-center justify-center">
                        <Loading />
                    </div>
                ) : (
                    <SectorPerformanceTable
                        laps={laps || []}
                        drivers={drivers}
                        selectedDrivers={selectedDrivers}
                    />
                )}
            </section>

            {/* テレメトリー分析 (Phase 2 Enhanced) */}
            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-2 text-lg font-semibold text-gray-900">
                    {t('analysis.telemetryDetails')}
                </h2>
                <p className="mb-6 text-sm text-gray-600">
                    特定のラップにおける速度、スロットル、ブレーキ、ギアの詳細データを表示します。最大2人のドライバーを比較できます。
                </p>

                {/* ドライバー選択エリア */}
                <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* ドライバー1 */}
                    <div className="relative overflow-hidden rounded-xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm transition-all hover:shadow-md">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">ドライバー 1</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">ドライバー</label>
                                    <select
                                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        value={telemetryDriver || ''}
                                        onChange={(e) => setTelemetryDriver(Number(e.target.value))}
                                    >
                                        {selectedDrivers.map(dNum => {
                                            const d = drivers.find((dr: Driver) => dr.driver_number === dNum);
                                            return <option key={dNum} value={dNum}>{d?.name_acronym || dNum}</option>;
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">ラップ</label>
                                    <div className="flex gap-2">
                                        <select
                                            className="flex-1 rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                            value={telemetryLap || ''}
                                            onChange={(e) => setTelemetryLap(Number(e.target.value))}
                                        >
                                            <option value="">ラップを選択...</option>
                                            {telemetryDriver && (laps || [])
                                                .filter(l => l.driver_number === telemetryDriver)
                                                .map(lap => (
                                                    <option key={lap.lap_number} value={lap.lap_number}>
                                                        Lap {lap.lap_number}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                        <button
                                            onClick={() => telemetryDriver && selectBestLap(telemetryDriver, false)}
                                            className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none uppercase tracking-wide whitespace-nowrap"
                                            disabled={!telemetryDriver}
                                        >
                                            ⚡ Best
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ドライバー2 */}
                    <div className="relative overflow-hidden rounded-xl border-2 border-red-100 bg-gradient-to-br from-red-50 to-white p-5 shadow-sm transition-all hover:shadow-md">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">ドライバー 2 (比較)</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">ドライバー</label>
                                    <select
                                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all hover:border-red-300 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                                        value={telemetryDriver2 || ''}
                                        onChange={(e) => setTelemetryDriver2(Number(e.target.value) || null)}
                                    >
                                        <option value="">選択なし</option>
                                        {selectedDrivers.map(dNum => {
                                            const d = drivers.find((dr: Driver) => dr.driver_number === dNum);
                                            return <option key={dNum} value={dNum}>{d?.name_acronym || dNum}</option>;
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">ラップ</label>
                                    <div className="flex gap-2">
                                        <select
                                            className="flex-1 rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all hover:border-red-300 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            value={telemetryLap2 || ''}
                                            onChange={(e) => setTelemetryLap2(Number(e.target.value) || null)}
                                            disabled={!telemetryDriver2}
                                        >
                                            <option value="">ラップを選択...</option>
                                            {telemetryDriver2 && (laps || [])
                                                .filter(l => l.driver_number === telemetryDriver2)
                                                .map(lap => (
                                                    <option key={lap.lap_number} value={lap.lap_number}>
                                                        Lap {lap.lap_number}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                        <button
                                            onClick={() => telemetryDriver2 && selectBestLap(telemetryDriver2, true)}
                                            className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-bold rounded-lg shadow-md hover:from-red-700 hover:to-red-800 hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none uppercase tracking-wide whitespace-nowrap"
                                            disabled={!telemetryDriver2}
                                        >
                                            ⚡ Best
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 系列表示切り替え */}
                <div className="mb-6 rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-5 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        表示する系列
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        <label
                            className={`relative flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-105 ${visibleSeries.speed
                                ? 'border-blue-400 bg-blue-50 shadow-md'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={visibleSeries.speed}
                                onChange={(e) => setVisibleSeries({ ...visibleSeries, speed: e.target.checked })}
                                className="sr-only"
                            />
                            <span className="text-2xl">🏎️</span>
                            <span className={`text-xs font-bold uppercase tracking-wide ${visibleSeries.speed ? 'text-blue-700' : 'text-gray-600'
                                }`}>Speed</span>
                            {visibleSeries.speed && (
                                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </label>

                        <label
                            className={`relative flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-105 ${visibleSeries.rpm
                                ? 'border-red-400 bg-red-50 shadow-md'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={visibleSeries.rpm}
                                onChange={(e) => setVisibleSeries({ ...visibleSeries, rpm: e.target.checked })}
                                className="sr-only"
                            />
                            <span className="text-2xl">⚙️</span>
                            <span className={`text-xs font-bold uppercase tracking-wide ${visibleSeries.rpm ? 'text-red-700' : 'text-gray-600'
                                }`}>RPM</span>
                            {visibleSeries.rpm && (
                                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </label>

                        <label
                            className={`relative flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-105 ${visibleSeries.throttle
                                ? 'border-green-400 bg-green-50 shadow-md'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={visibleSeries.throttle}
                                onChange={(e) => setVisibleSeries({ ...visibleSeries, throttle: e.target.checked })}
                                className="sr-only"
                            />
                            <span className="text-2xl">⬆️</span>
                            <span className={`text-xs font-bold uppercase tracking-wide ${visibleSeries.throttle ? 'text-green-700' : 'text-gray-600'
                                }`}>Throttle</span>
                            {visibleSeries.throttle && (
                                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </label>

                        <label
                            className={`relative flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-105 ${visibleSeries.brake
                                ? 'border-purple-400 bg-purple-50 shadow-md'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={visibleSeries.brake}
                                onChange={(e) => setVisibleSeries({ ...visibleSeries, brake: e.target.checked })}
                                className="sr-only"
                            />
                            <span className="text-2xl">🛑</span>
                            <span className={`text-xs font-bold uppercase tracking-wide ${visibleSeries.brake ? 'text-purple-700' : 'text-gray-600'
                                }`}>Brake</span>
                            {visibleSeries.brake && (
                                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </label>

                        <label
                            className={`relative flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-105 ${visibleSeries.gear
                                ? 'border-orange-400 bg-orange-50 shadow-md'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={visibleSeries.gear}
                                onChange={(e) => setVisibleSeries({ ...visibleSeries, gear: e.target.checked })}
                                className="sr-only"
                            />
                            <span className="text-2xl">🔢</span>
                            <span className={`text-xs font-bold uppercase tracking-wide ${visibleSeries.gear ? 'text-orange-700' : 'text-gray-600'
                                }`}>Gear</span>
                            {visibleSeries.gear && (
                                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </label>
                    </div>
                </div>

                {/* チャート表示エリア */}
                {!telemetryLap ? (
                    <div className="flex h-64 items-center justify-center text-gray-500">
                        ドライバー1のラップを選択してテレメトリーデータを表示
                    </div>
                ) : carDataLoading || (telemetryDriver2 && carDataLoading2) ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loading />
                    </div>
                ) : (
                    <TelemetryChart
                        data={carData || []}
                        data2={telemetryDriver2 && telemetryLap2 ? (carData2 || []) : undefined}
                        driver1={drivers.find(d => d.driver_number === telemetryDriver)}
                        driver2={telemetryDriver2 ? drivers.find(d => d.driver_number === telemetryDriver2) : undefined}
                        visibleSeries={visibleSeries}
                    />
                )}
            </section>

            {/* 免責事項 / Data disclaimer */}
            <div className="rounded-lg bg-gray-50 p-4 text-xs text-gray-500">
                <p className="font-semibold mb-1">{t('disclaimer.title')}</p>
                <p>{t('disclaimer.body')}</p>
            </div>
        </div>
    );
}
