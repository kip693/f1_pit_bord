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
      <div className="flex h-32 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-500">デグラデーションデータがありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 説明セクション */}
      <div className="rounded-lg border border-gray-200 bg-gradient-to-r from-blue-50 to-white p-4 shadow-sm">
        <button
          onClick={() => setIsExplanationOpen(!isExplanationOpen)}
          className="flex w-full items-center justify-between text-left"
        >
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            指標の説明
          </h3>
          <svg
            className={`h-5 w-5 text-gray-500 transition-transform ${isExplanationOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isExplanationOpen && (
          <div className="mt-3 space-y-2 text-xs text-gray-600 border-t border-gray-200 pt-3">
            <p>
              <strong className="text-gray-700">ギャップ/ラップ:</strong>{' '}
              各ラップでリーダーとのギャップがどれだけ広がったか（秒/ラップ）
            </p>
            <p>
              <strong className="text-gray-700">劣化/ラップ:</strong>{' '}
              スティント内でラップタイムがどれだけ悪化したか（秒/ラップ）
            </p>
            <p>
              <strong className="text-gray-700">総劣化:</strong>{' '}
              スティント全体でのラップタイムの悪化量（秒）
            </p>
            <p>
              <strong className="text-gray-700">R²:</strong>{' '}
              劣化の線形性（1に近いほど一定のペースで劣化）
            </p>
          </div>
        )}
      </div>

      {/* テーブル */}
      <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                    ドライバー
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                    スティント
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                    タイヤ
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-700">
                    平均ラップタイム
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-700">
                    ギャップ/ラップ
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-700">
                    劣化/ラップ
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-700">
                    総劣化
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-700">
                    R²
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {degradationData.map((deg) => {
                  const driver = getDriver(deg.driver_number);
                  if (!driver) return null;

                  return (
                    <tr key={`${deg.driver_number}-${deg.stint_number}`} className="hover:bg-gray-50 transition-colors">
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full ring-2 ring-white shadow-sm"
                            style={{ backgroundColor: `#${driver.team_colour}` }}
                          />
                          <span className="text-sm font-bold text-gray-900">
                            {driver.name_acronym}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-700">
                        #{deg.stint_number}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className="inline-flex rounded-full px-3 py-1 text-xs font-bold shadow-sm"
                          style={{
                            backgroundColor: getTyreColor(deg.compound),
                            color: deg.compound === 'HARD' || deg.compound === 'MEDIUM' ? '#111827' : '#ffffff',
                          }}
                        >
                          {deg.compound}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {deg.average_lap_time ? `${deg.average_lap_time.toFixed(3)}s` : 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                        {deg.gap_per_lap !== null ? `${deg.gap_per_lap >= 0 ? '+' : ''}${deg.gap_per_lap.toFixed(3)}s` : 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-red-600">
                        {deg.degradation_per_lap !== null ? `+${deg.degradation_per_lap.toFixed(3)}s` : 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-red-600">
                        {deg.total_degradation !== null ? `+${deg.total_degradation.toFixed(3)}s` : 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                        {deg.r_squared !== null ? deg.r_squared.toFixed(3) : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
