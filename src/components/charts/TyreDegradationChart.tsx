import { useMemo, useState } from 'react';
import type { Lap, Stint, Driver } from '@/lib/api/types';
import { calculateTyreDegradation } from '@/lib/utils/lapAnalysis';
import { getTyreColor } from '@/lib/utils/format';

interface TyreDegradationChartProps {
  laps: Lap[];
  stints: Stint[];
  drivers: Driver[];
  selectedDrivers: number[];
}

export function TyreDegradationChart({
  laps,
  stints,
  drivers,
  selectedDrivers,
}: TyreDegradationChartProps) {
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  // デグラデーションデータを計算
  const degradationData = useMemo(() => {
    const allDegradation = calculateTyreDegradation(laps, stints);
    return allDegradation.filter((deg) =>
      selectedDrivers.includes(deg.driver_number),
    );
  }, [laps, stints, selectedDrivers]);

  // ドライバー情報を取得
  const getDriver = (driverNumber: number) => {
    return drivers.find((d) => d.driver_number === driverNumber);
  };

  if (degradationData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        デグラデーションデータがありません
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              ドライバー
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              スティント
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              タイヤ
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              平均ラップタイム
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              劣化/ラップ
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              総劣化
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              R²
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {degradationData.map((deg) => {
            const driver = getDriver(deg.driver_number);
            if (!driver) return null;

            return (
              <tr key={`${deg.driver_number}-${deg.stint_number}`} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: `#${driver.team_colour}` }}
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {driver.name_acronym}
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  #{deg.stint_number}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: getTyreColor(deg.compound),
                      color: deg.compound === 'HARD' || deg.compound === 'MEDIUM' ? '#111827' : '#ffffff',
                    }}
                  >
                    {deg.compound}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                  {deg.average_lap_time.toFixed(3)}s
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                  <span
                    className={
                      deg.degradation_per_lap > 0.05
                        ? 'text-red-600'
                        : deg.degradation_per_lap > 0.02
                          ? 'text-yellow-600'
                          : 'text-green-600'
                    }
                  >
                    {deg.degradation_per_lap >= 0 ? '+' : ''}{deg.degradation_per_lap.toFixed(4)}s
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                  {deg.total_degradation >= 0 ? '+' : ''}{deg.total_degradation.toFixed(3)}s
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-500">
                  {deg.r_squared.toFixed(3)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 説明（ドロップダウン） */}
      <div className="mt-4">
        <button
          onClick={() => setIsExplanationOpen(!isExplanationOpen)}
          className="flex w-full items-center justify-between rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900 transition-colors hover:bg-blue-100"
        >
          <span>📊 指標の説明</span>
          <span className="text-lg">{isExplanationOpen ? '▲' : '▼'}</span>
        </button>

        {isExplanationOpen && (
          <div className="mt-2 space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <p className="font-semibold">デグラデーション指標の説明:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <strong>劣化/ラップ</strong>: 線形回帰で計算した1ラップあたりのタイム増加率（傾き）
                <ul className="ml-4 mt-1 list-circle space-y-1 text-xs">
                  <li>スティント全体のラップタイム推移から統計的に算出</li>
                  <li>単純な平均ではなく、トレンドラインの傾きを表す</li>
                </ul>
              </li>
              <li>
                <strong>総劣化</strong>: スティント全体でのタイム増加（劣化/ラップ × ラップ数）
              </li>
              <li>
                <strong>R²（決定係数）</strong>: タイヤ劣化の安定性・予測可能性を示す指標（0〜1の範囲）
                <ul className="ml-4 mt-1 list-circle space-y-1 text-xs">
                  <li><strong>1に近い（0.9〜1.0）</strong>: 劣化が一定ペースで進行。ペース管理がしやすく予測可能</li>
                  <li><strong>中程度（0.7〜0.9）</strong>: ある程度安定しているが、変動要因あり</li>
                  <li><strong>低い（0.7未満）</strong>: 劣化が不規則。交通状況、タイヤ温度の変動、ドライバーのペース変化などの影響が大きい</li>
                </ul>
              </li>
            </ul>
            <div className="mt-2 flex gap-4">
              <span className="text-green-600">● 良好（&lt;0.02s/lap）</span>
              <span className="text-yellow-600">● 中程度（0.02-0.05s/lap）</span>
              <span className="text-red-600">● 高い（&gt;0.05s/lap）</span>
            </div>
            <div className="mt-3 border-t border-blue-200 pt-3">
              <p className="font-semibold">数値の見方:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>
                  <strong>プラス（+）</strong>: タイヤが劣化してラップタイムが遅くなっている（通常の状態）
                </li>
                <li>
                  <strong>マイナス（-）</strong>: ラップタイムが速くなっている
                  <ul className="ml-4 mt-1 list-circle space-y-1 text-xs">
                    <li>燃料が減って車が軽くなった効果が、タイヤ劣化より大きい</li>
                    <li>コース状態が改善した（ゴムが蓄積、気温変化など）</li>
                    <li>ドライバーがペースを上げた</li>
                    <li>タイヤが理想的な作動温度範囲に入った</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
