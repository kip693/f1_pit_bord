import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useDrivers,
  useMultipleDriversLaps,
  usePitStops,
  useStints,
  useFlags,
} from '@/lib/hooks/useF1Data';
import { parseSessionParams, parseDriverFilterParams } from '@/lib/utils/urlParams';
import { Layout } from '@/components/layout/Layout';
import { LapTimeChart } from '@/components/charts/LapTimeChart';
import { PitStrategyTimeline } from '@/components/charts/PitStrategyTimeline';
import { TyreDegradationChart } from '@/components/charts/TyreDegradationChart';
import { Loading } from '@/components/common/Loading';
import { ErrorMessage } from '@/components/common/ErrorMessage';

export function RaceAnalysisPage() {
  // URLパラメータから状態を取得
  const [searchParams] = useSearchParams();
  const sessionParams = parseSessionParams(searchParams);
  const driverFilterParams = parseDriverFilterParams(searchParams);

  // 選択されたドライバー番号
  const selectedDrivers = driverFilterParams.drivers || [];

  // データフェッチング
  const { data: drivers, isLoading: driversLoading, error: driversError } = useDrivers(
    sessionParams.session,
  );
  const { data: laps, isLoading: lapsLoading, error: lapsError } = useMultipleDriversLaps(
    sessionParams.session,
    selectedDrivers,
  );
  const { data: pitStops, isLoading: pitStopsLoading, error: pitStopsError } = usePitStops(
    sessionParams.session,
  );
  const { data: stints, isLoading: stintsLoading, error: stintsError } = useStints(
    sessionParams.session,
  );
  const { data: flags } = useFlags(sessionParams.session);

  // 最大ラップ数を計算
  const maxLap = useMemo(() => {
    if (!laps || laps.length === 0) return 70;
    return Math.max(...laps.map((l) => l.lap_number));
  }, [laps]);

  // ローディング状態
  const isLoading = driversLoading || lapsLoading || pitStopsLoading || stintsLoading;
  const error = driversError || lapsError || pitStopsError || stintsError;

  // セッションが選択されていない場合
  if (!sessionParams.session) {
    return (
      <Layout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">セッションを選択してください</p>
            <p className="mt-2 text-sm text-gray-500">
              左側のセレクターから年、GP、セッションを選択してください
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // ローディング中
  if (isLoading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  // エラー発生
  if (error) {
    return (
      <Layout>
        <ErrorMessage message={error.message} />
      </Layout>
    );
  }

  // データが存在しない
  if (!drivers || !laps || !pitStops || !stints) {
    return (
      <Layout>
        <ErrorMessage message="データの取得に失敗しました" />
      </Layout>
    );
  }

  // ドライバーが選択されていない場合
  if (selectedDrivers.length === 0) {
    return (
      <Layout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">ドライバーを選択してください</p>
            <p className="mt-2 text-sm text-gray-500">
              左側のフィルターから比較したいドライバーを選択してください
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* ページヘッダー */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">本戦分析</h1>
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
    </Layout>
  );
}
