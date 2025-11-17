import { useMemo, useState } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
  ZAxis,
  LineChart,
} from 'recharts';
import type { Lap, PitStop, Driver } from '@/lib/api/types';
import { calculateGapData } from '@/lib/utils/lapAnalysis';
import { formatLapTime } from '@/lib/utils/format';

type ChartMode = 'laptime' | 'gap';

interface LapTimeChartProps {
  laps: Lap[];
  pitStops: PitStop[];
  drivers: Driver[];
  selectedDrivers: number[];
}

export function LapTimeChart({
  laps,
  pitStops,
  drivers,
  selectedDrivers,
}: LapTimeChartProps) {
  const [mode, setMode] = useState<ChartMode>('laptime');

  // ラップタイムデータ処理（ピットアウトラップも含める）
  const laptimeData = useMemo(() => {
    console.log('[LapTimeChart] Processing laptime data:', {
      lapsCount: laps?.length,
      selectedDriversCount: selectedDrivers.length,
      selectedDrivers,
    });

    if (!laps || laps.length === 0 || selectedDrivers.length === 0) {
      console.log('[LapTimeChart] Early return: no data');
      return [];
    }

    const filteredLaps = laps.filter((lap) => selectedDrivers.includes(lap.driver_number));
    console.log('[LapTimeChart] Filtered laps:', filteredLaps.length);

    if (filteredLaps.length === 0) {
      console.log('[LapTimeChart] No filtered laps');
      return [];
    }

    const lapsByDriver = filteredLaps.reduce(
      (acc, lap) => {
        if (!acc[lap.driver_number]) {
          acc[lap.driver_number] = [];
        }
        acc[lap.driver_number].push(lap);
        return acc;
      },
      {} as Record<number, Lap[]>,
    );

    const maxLap = Math.max(...filteredLaps.map((l) => l.lap_number));
    console.log('[LapTimeChart] Max lap:', maxLap);

    if (!isFinite(maxLap) || maxLap < 1) {
      console.log('[LapTimeChart] Invalid maxLap');
      return [];
    }

    const chartData: any[] = [];

    for (let lapNum = 1; lapNum <= maxLap; lapNum++) {
      const dataPoint: any = { lap_number: lapNum };
      let hasData = false;

      selectedDrivers.forEach((driverNum) => {
        const lap = lapsByDriver[driverNum]?.find((l) => l.lap_number === lapNum);
        if (lap && lap.lap_duration) {
          // すべてのラップを同じキーに格納（通常ラップもピットアウトラップも）
          dataPoint[`driver_${driverNum}`] = lap.lap_duration;
          dataPoint[`driver_${driverNum}_isPit`] = lap.is_pit_out_lap || false;
          hasData = true;
        } else {
          dataPoint[`driver_${driverNum}`] = null;
          dataPoint[`driver_${driverNum}_isPit`] = false;
        }
      });

      // データがあるラップのみ追加（すべてnullの場合はスキップ）
      if (hasData) {
        chartData.push(dataPoint);
      }
    }

    console.log('[LapTimeChart] Chart data length:', chartData.length);
    console.log('[LapTimeChart] Sample data:', chartData.slice(0, 3));
    return chartData;
  }, [laps, selectedDrivers]);

  // ギャップデータ処理
  const gapData = useMemo(() => {
    const result = calculateGapData(laps, selectedDrivers);
    console.log('[LapTimeChart] Gap data length:', result.length);
    console.log('[LapTimeChart] Gap data sample:', result.slice(0, 3));
    return result;
  }, [laps, selectedDrivers]);

  // ピットストップマーカー用データ
  const pitMarkers = useMemo(() => {
    if (!pitStops || !drivers) return [];

    const markers = pitStops
      .filter((pit) => selectedDrivers.includes(pit.driver_number))
      .map((pit) => {
        const lap = laps.find(
          (l) => l.driver_number === pit.driver_number && l.lap_number === pit.lap_number,
        );
        return {
          lap_number: pit.lap_number,
          driver_number: pit.driver_number,
          pit_duration: pit.pit_duration,
          lap_time: lap?.lap_duration || 0,
        };
      });

    console.log('[LapTimeChart] Pit markers:', markers);
    return markers;
  }, [pitStops, selectedDrivers, laps]);

  // ドライバー情報を取得
  const getDriver = (driverNumber: number) => {
    return drivers.find((d) => d.driver_number === driverNumber);
  };

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
        <p className="mb-2 font-bold text-gray-900">Lap {label}</p>
        {payload.map((entry: any, index: number) => {
          // driver_X_gap または driver_X の形式から番号を抽出
          const keyParts = entry.dataKey.split('_');
          const driverNumber = parseInt(keyParts[1]);
          const driver = getDriver(driverNumber);

          if (!driver) return null;

          const pitStop = pitStops.find(
            (p) => p.driver_number === driverNumber && p.lap_number === label,
          );

          // ギャップモードの場合
          if (mode === 'gap') {
            const gapValue = entry.value;
            return (
              <div key={index} className="mt-1">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm font-medium text-gray-900">{driver.name_acronym}:</span>
                  <span className="text-sm text-gray-700">
                    {gapValue === 0
                      ? 'Leader'
                      : gapValue > 0
                        ? `+${gapValue.toFixed(3)}s`
                        : `${gapValue.toFixed(3)}s`}
                  </span>
                </div>
                {pitStop && pitStop.pit_duration && (
                  <p className="ml-5 text-xs text-orange-600">
                    🔧 Pit: {pitStop.pit_duration.toFixed(1)}s
                  </p>
                )}
              </div>
            );
          }

          // ラップタイムモードの場合
          return (
            <div key={index} className="mt-1">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm font-medium text-gray-900">{driver.name_acronym}:</span>
                <span className="text-sm text-gray-700">
                  {entry.value ? formatLapTime(entry.value) : '--:--.---'}
                </span>
              </div>
              {pitStop && pitStop.pit_duration && (
                <p className="ml-5 text-xs text-orange-600">
                  🔧 Pit: {pitStop.pit_duration.toFixed(1)}s
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Y軸のフォーマット（ラップタイムモード）
  const formatYAxisLaptime = (value: number) => {
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${minutes}:${seconds.toFixed(0).padStart(2, '0')}`;
  };

  // Y軸のフォーマット（ギャップモード）
  const formatYAxisGap = (value: number) => {
    return value === 0 ? '0.0s' : `+${value.toFixed(1)}s`;
  };

  if (laptimeData.length === 0 && gapData.length === 0) {
    console.log('[LapTimeChart] No data to display');
    return (
      <div className="flex h-96 items-center justify-center text-gray-500">
        データがありません
      </div>
    );
  }

  const currentData = mode === 'laptime' ? laptimeData : gapData;

  console.log('[LapTimeChart] Render check:', {
    laptimeDataLength: laptimeData.length,
    gapDataLength: gapData.length,
    mode,
    currentDataLength: currentData.length,
    sampleData: currentData.slice(0, 2),
    drivers: selectedDrivers.map(num => {
      const d = getDriver(num);
      return { num, acronym: d?.name_acronym, colour: d?.team_colour };
    }),
  });

  console.log('[LapTimeChart] Lines to render:', selectedDrivers.map(num => {
    const driver = getDriver(num);
    const dataKey = mode === 'laptime' ? `driver_${num}` : `driver_${num}_gap`;
    return {
      driverNum: num,
      dataKey,
      hasDriver: !!driver,
      colour: driver?.team_colour,
      strokeValue: `#${driver?.team_colour}`
    };
  }));

  return (
    <div className="space-y-4">
      {/* モード切り替えタブ */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setMode('laptime')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'laptime'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          ラップタイム
        </button>
        <button
          onClick={() => setMode('gap')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'gap'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          ギャップ（累積タイム差）
        </button>
      </div>

      {/* グラフ */}
      <ResponsiveContainer width="100%" height={450}>
        <LineChart data={currentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="lap_number"
            label={{ value: 'Lap', position: 'insideBottom', offset: 15, dy: 5 }}
            stroke="#6b7280"
            height={50}
          />
          <YAxis
            tickFormatter={mode === 'laptime' ? formatYAxisLaptime : formatYAxisGap}
            label={{
              value: mode === 'laptime' ? 'Lap Time' : 'Gap to Leader',
              angle: -90,
              position: 'insideLeft',
            }}
            stroke="#6b7280"
            domain={mode === 'laptime' ? ['dataMin', 'dataMax'] : [0, 'dataMax + 5']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => {
              const keyParts = value.split('_');
              const driverNumber = parseInt(keyParts[1]);
              const driver = getDriver(driverNumber);
              return driver?.name_acronym || value;
            }}
          />

          {/* ドライバーごとのライン */}
          {selectedDrivers.map((driverNum) => {
            const driver = getDriver(driverNum);
            if (!driver) {
              console.warn(`[LapTimeChart] Driver ${driverNum} not found`);
              return null;
            }

            const dataKey =
              mode === 'laptime' ? `driver_${driverNum}` : `driver_${driverNum}_gap`;

            const strokeColor = `#${driver.team_colour}`;
            console.log(`[LapTimeChart] Rendering Line for ${driver.name_acronym}:`, {
              dataKey,
              stroke: strokeColor,
              driverNum,
            });

            return (
              <Line
                key={dataKey}
                type="linear"
                dataKey={dataKey}
                name={dataKey}
                stroke={strokeColor}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
                connectNulls={true}
                isAnimationActive={false}
              />
            );
          })}

          {/* ピットストップマーカー */}
          {pitMarkers.map((pit, index) => {
            const driver = getDriver(pit.driver_number);
            if (!driver) return null;

            const yValue =
              mode === 'laptime'
                ? pit.lap_time
                : gapData.find((d) => d.lap_number === pit.lap_number)?.[
                    `driver_${pit.driver_number}_gap`
                  ] || 0;

            return (
              <Scatter
                key={`pit-${index}`}
                data={[{ x: pit.lap_number, y: yValue }]}
                fill={`#${driver.team_colour}`}
                shape="circle"
                legendType="none"
              >
                <ZAxis range={[100, 100]} />
              </Scatter>
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
