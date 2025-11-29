import type { Lap, PitStop, Stint } from '@/lib/api/types';

/**
 * ラップタイム分析用ユーティリティ
 */

// グラフ用のラップタイムデータ
export interface LapTimeChartData {
  lap_number: number;
  [key: `driver_${number}`]: number | null;
}

// ギャップ（累積タイム差）データ
export interface GapChartData {
  lap_number: number;
  [key: `driver_${number}_gap`]: number | null;
  [key: `driver_${number}_cumulative`]: number | null;
}

/**
 * ドライバー別にラップタイムデータを整形
 */
export function processLapData(
  laps: Lap[],
  selectedDrivers: number[],
): LapTimeChartData[] {
  if (!laps || laps.length === 0) return [];

  // ドライバー別にグループ化
  const lapsByDriver = laps
    .filter((lap) => selectedDrivers.includes(lap.driver_number))
    .reduce(
      (acc, lap) => {
        if (!acc[lap.driver_number]) {
          acc[lap.driver_number] = [];
        }
        acc[lap.driver_number].push(lap);
        return acc;
      },
      {} as Record<number, Lap[]>,
    );

  // 最大ラップ数を取得
  const maxLap = Math.max(...laps.map((l) => l.lap_number));

  // ラップごとにデータを整形
  const chartData: LapTimeChartData[] = [];
  for (let lapNum = 1; lapNum <= maxLap; lapNum++) {
    const dataPoint: LapTimeChartData = { lap_number: lapNum };

    selectedDrivers.forEach((driverNum) => {
      const lap = lapsByDriver[driverNum]?.find((l) => l.lap_number === lapNum);

      // ピットアウトラップは除外（グラフの連続性を保つ）
      if (lap && !lap.is_pit_out_lap && lap.lap_duration) {
        dataPoint[`driver_${driverNum}`] = lap.lap_duration;
      } else {
        dataPoint[`driver_${driverNum}`] = null;
      }
    });

    chartData.push(dataPoint);
  }

  return chartData;
}

/**
 * ドライバーのベストラップを取得
 */
export function getBestLapByDriver(
  laps: Lap[],
  driverNumber: number,
): Lap | null {
  const driverLaps = laps.filter(
    (lap) =>
      lap.driver_number === driverNumber &&
      !lap.is_pit_out_lap &&
      lap.lap_duration !== null,
  );

  if (driverLaps.length === 0) return null;

  return driverLaps.reduce((best, current) =>
    current.lap_duration! < best.lap_duration! ? current : best,
  );
}

/**
 * ピットストップ情報を含むラップデータを作成
 */
export interface LapWithPitInfo {
  lap_number: number;
  driver_number: number;
  lap_duration: number | null;
  is_pit_lap: boolean;
  pit_duration?: number;
}

export function enrichLapsWithPitInfo(
  laps: Lap[],
  pitStops: PitStop[],
): LapWithPitInfo[] {
  return laps.map((lap) => {
    const pitStop = pitStops.find(
      (pit) =>
        pit.driver_number === lap.driver_number &&
        pit.lap_number === lap.lap_number,
    );

    return {
      lap_number: lap.lap_number,
      driver_number: lap.driver_number,
      lap_duration: lap.lap_duration,
      is_pit_lap: !!pitStop,
      pit_duration: pitStop?.pit_duration,
    };
  });
}

/**
 * スティント別のラップタイムを取得
 */
export interface StintLaps {
  stint: Stint;
  laps: Lap[];
  average_lap_time: number;
}

export function getLapsByStint(laps: Lap[], stints: Stint[]): StintLaps[] {
  return stints.map((stint) => {
    const stintLaps = laps.filter(
      (lap) =>
        lap.driver_number === stint.driver_number &&
        lap.lap_number >= stint.lap_start &&
        lap.lap_number <= stint.lap_end &&
        !lap.is_pit_out_lap &&
        lap.lap_duration !== null,
    );

    const average =
      stintLaps.length > 0
        ? stintLaps.reduce((sum, lap) => sum + lap.lap_duration!, 0) /
        stintLaps.length
        : 0;

    return {
      stint,
      laps: stintLaps,
      average_lap_time: average,
    };
  });
}

/**
 * タイヤデグラデーション計算（線形回帰）
 */
export interface TyreDegradation {
  driver_number: number;
  stint_number: number;
  compound: string;
  degradation_per_lap: number; // 秒/ラップ
  total_degradation: number;
  average_lap_time: number;
  r_squared: number; // 決定係数
  gap_per_lap: number | null; // 1ラップあたりの平均ギャップタイム（秒/ラップ）
}

export function calculateTyreDegradation(
  laps: Lap[],
  stints: Stint[],
): TyreDegradation[] {
  const results: TyreDegradation[] = [];

  // 全ドライバーの累積タイムを計算して、各ラップのリーダー（最速累積タイム）を特定する
  const maxLap = Math.max(...laps.map((l) => l.lap_number));
  const leaderCumulativeTimes: Record<number, number> = {}; // lap_number -> cumulative_time

  // ラップごとにグループ化
  const lapsByLapNumber: Record<number, Lap[]> = {};
  laps.forEach(lap => {
    if (!lapsByLapNumber[lap.lap_number]) {
      lapsByLapNumber[lap.lap_number] = [];
    }
    lapsByLapNumber[lap.lap_number].push(lap);
  });

  // 各ドライバーの累積タイムを追跡
  const driverCumulativeTimes: Record<number, number> = {};

  for (let i = 1; i <= maxLap; i++) {
    const currentLaps = lapsByLapNumber[i] || [];

    // 各ドライバーの累積タイムを更新
    currentLaps.forEach(lap => {
      if (lap.lap_duration) {
        driverCumulativeTimes[lap.driver_number] = (driverCumulativeTimes[lap.driver_number] || 0) + lap.lap_duration;
      }
    });

    // このラップ時点でのリーダー（最小累積タイム）を見つける
    const validTimes = Object.values(driverCumulativeTimes).filter(t => t > 0);
    if (validTimes.length > 0) {
      leaderCumulativeTimes[i] = Math.min(...validTimes);
    }
  }

  stints.forEach((stint) => {
    const stintLaps = laps.filter(
      (lap) =>
        lap.driver_number === stint.driver_number &&
        lap.lap_number >= stint.lap_start &&
        lap.lap_number <= stint.lap_end &&
        !lap.is_pit_out_lap &&
        lap.lap_duration !== null,
    );

    if (stintLaps.length < 3) return; // 最低3ラップ必要

    // スティント内での相対ラップ番号と時間
    const lapNumbers = stintLaps.map((l) => l.lap_number - stint.lap_start);
    const lapTimes = stintLaps.map((l) => l.lap_duration!);

    // 線形回帰
    const regression = calculateLinearRegression(lapNumbers, lapTimes);
    const averageLapTime =
      lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length;
    const totalDegradation =
      regression.slope * (stint.lap_end - stint.lap_start);

    // ギャップ/ラップの計算
    let gapPerLap: number | null = null;

    // スティント開始時と終了時の累積タイムを取得（リーダーとの差）
    // 正確には、スティントに含まれる最初のラップと最後のラップで計算
    const startLap = stintLaps[0];
    const endLap = stintLaps[stintLaps.length - 1];

    if (startLap && endLap) {
      // このドライバーの累積タイムを再計算（全体の中での位置を知るため）
      // 注: 上で計算した driverCumulativeTimes は最終状態なので、ここでは履歴が必要
      // 簡易的に、このスティント期間中のリーダーとのペース差を計算する

      // リーダーの区間タイム（スティント開始〜終了）
      const leaderStartCumulative = leaderCumulativeTimes[startLap.lap_number - 1] || 0; // 前のラップ終了時点
      const leaderEndCumulative = leaderCumulativeTimes[endLap.lap_number];

      // このドライバーの区間タイム
      const driverIntervalTime = lapTimes.reduce((sum, t) => sum + t, 0);

      if (leaderEndCumulative && leaderStartCumulative) {
        const leaderIntervalTime = leaderEndCumulative - leaderStartCumulative;
        const timeLost = driverIntervalTime - leaderIntervalTime;
        const numberOfLaps = endLap.lap_number - startLap.lap_number + 1;

        gapPerLap = timeLost / numberOfLaps;
      }
    }

    results.push({
      driver_number: stint.driver_number,
      stint_number: stint.stint_number,
      compound: stint.compound,
      degradation_per_lap: regression.slope,
      total_degradation: totalDegradation,
      average_lap_time: averageLapTime,
      r_squared: regression.rSquared,
      gap_per_lap: gapPerLap,
    });
  });

  return results;
}

/**
 * 線形回帰計算
 */
function calculateLinearRegression(x: number[], y: number[]) {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // 決定係数 (R²)
  const meanY = sumY / n;
  const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
  const ssResidual = x.reduce(
    (sum, xi, i) => sum + Math.pow(y[i] - (slope * xi + intercept), 2),
    0,
  );
  const rSquared = 1 - ssResidual / ssTotal;

  return { slope, intercept, rSquared };
}

/**
 * ラップ範囲でフィルタリング
 */
export function filterLapsByRange(
  data: LapTimeChartData[],
  startLap?: number,
  endLap?: number,
): LapTimeChartData[] {
  if (!startLap && !endLap) return data;

  return data.filter((item) => {
    if (startLap && item.lap_number < startLap) return false;
    if (endLap && item.lap_number > endLap) return false;
    return true;
  });
}

/**
 * 累積タイム差（ギャップ）を計算
 * 先頭ドライバーとの差を秒単位で返す
 */
export function calculateGapData(
  laps: Lap[],
  selectedDrivers: number[],
): GapChartData[] {
  if (!laps || laps.length === 0 || selectedDrivers.length === 0) return [];

  // ドライバー別にグループ化
  const filteredLaps = laps.filter((lap) => selectedDrivers.includes(lap.driver_number));
  if (filteredLaps.length === 0) return [];

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

  // 各ドライバーのラップをラップ番号順にソート
  Object.keys(lapsByDriver).forEach((driverNum) => {
    lapsByDriver[Number(driverNum)].sort((a, b) => a.lap_number - b.lap_number);
  });

  // 最大ラップ数を取得
  const maxLap = Math.max(...filteredLaps.map((l) => l.lap_number));
  if (!isFinite(maxLap) || maxLap < 1) return [];

  // 各ドライバーの累積タイムを計算
  const cumulativeTimes: Record<number, Record<number, number>> = {};
  selectedDrivers.forEach((driverNum) => {
    cumulativeTimes[driverNum] = {};
    let cumulative = 0;

    for (let lapNum = 1; lapNum <= maxLap; lapNum++) {
      const lap = lapsByDriver[driverNum]?.find((l) => l.lap_number === lapNum);
      // ラップタイムがある場合のみ有効とする
      if (lap && lap.lap_duration) {
        cumulative += lap.lap_duration;
        cumulativeTimes[driverNum][lapNum] = cumulative;
      }
      // ラップタイムがない場合は累積タイムを更新しない（＝そのラップ以降は計算対象外）
    }
  });

  // ラップごとのギャップデータを作成
  const gapData: GapChartData[] = [];
  for (let lapNum = 1; lapNum <= maxLap; lapNum++) {
    const dataPoint: GapChartData = { lap_number: lapNum };

    // そのラップでの最速累積タイムを見つける（先頭ドライバー）
    const validTimes = selectedDrivers
      .map((driverNum) => cumulativeTimes[driverNum][lapNum])
      .filter((time) => time !== undefined && isFinite(time));

    if (validTimes.length === 0) {
      // 有効なタイムがない場合はスキップ
      continue;
    }

    const leaderTime = Math.min(...validTimes);

    selectedDrivers.forEach((driverNum) => {
      const driverTime = cumulativeTimes[driverNum][lapNum];
      if (driverTime !== undefined) {
        // 先頭とのギャップ（秒）
        const gap = driverTime - leaderTime;
        dataPoint[`driver_${driverNum}_gap`] = gap;
        dataPoint[`driver_${driverNum}_cumulative`] = driverTime;
      } else {
        dataPoint[`driver_${driverNum}_gap`] = null;
        dataPoint[`driver_${driverNum}_cumulative`] = null;
      }
    });

    gapData.push(dataPoint);
  }

  return gapData;
}
