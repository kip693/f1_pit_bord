# 本戦分析: ラップタイムとピットタイミングの可視化 仕様書

## 1. 概要
本ドキュメントは、F1本戦におけるラップタイムとピットストップの可視化機能の詳細仕様を定義します。

---

## 2. 機能概要

### 2.1 目的
- ドライバーごとのラップタイム推移を可視化
- ピットストップのタイミングと戦略を分析
- アンダーカット・オーバーカットの成功/失敗を判定
- タイヤパフォーマンスとデグラデーションを可視化

### 2.2 画面構成
```
┌─────────────────────────────────────────────────────────┐
│ ヘッダー: セッション情報 (サーキット名、日付、天候)          │
├─────────────────────────────────────────────────────────┤
│ フィルタパネル: ドライバー選択、タイヤコンパウンド選択      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  【ラップタイム推移グラフ】                                │
│   - 折れ線グラフ（ドライバーごとに色分け）                  │
│   - ピットストップをマーカーで表示                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  【ピット戦略タイムライン】                                │
│   - ドライバーごとのスティント（タイヤ使用区間）を視覚化    │
│   - タイヤコンパウンドを色分け表示                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  【タイヤデグラデーション分析】                             │
│   - スティントごとのラップタイム劣化を可視化                │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  【ピットストップ詳細テーブル】                             │
│   - ピットインラップ、ロスタイム、タイヤ交換詳細            │
└─────────────────────────────────────────────────────────┘
```

---

## 3. ラップタイム推移グラフ

### 3.1 データ要件

#### 必要なAPIデータ
```typescript
// ラップタイムデータ
interface Lap {
  lap_number: number;
  lap_duration: number; // 秒
  driver_number: number;
  is_pit_out_lap: boolean;
  date_start: string;
  segments_sector_1: number[];
  segments_sector_2: number[];
  segments_sector_3: number[];
}

// ピットストップデータ
interface PitStop {
  lap_number: number;
  driver_number: number;
  pit_duration: number; // 秒
  date: string;
}

// スティントデータ
interface Stint {
  driver_number: number;
  stint_number: number;
  lap_start: number;
  lap_end: number;
  compound: 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET';
  tyre_age_at_start: number;
}
```

#### データ取得フロー
```typescript
// 1. セッションキーからデータ取得
const sessionKey = 9158; // URLパラメータから取得

// 2. 並行してデータフェッチ
const { data: laps } = useQuery({
  queryKey: ['laps', sessionKey],
  queryFn: () => f1Api.laps.getLapsBySession(sessionKey),
});

const { data: pitStops } = useQuery({
  queryKey: ['pitStops', sessionKey],
  queryFn: () => f1Api.pit.getPitStopsBySession(sessionKey),
});

const { data: stints } = useQuery({
  queryKey: ['stints', sessionKey],
  queryFn: () => f1Api.stints.getStintsBySession(sessionKey),
});

const { data: drivers } = useQuery({
  queryKey: ['drivers', sessionKey],
  queryFn: () => f1Api.drivers.getDriversBySession(sessionKey),
});
```

### 3.2 グラフ仕様

#### グラフタイプ
- **Recharts LineChart**
- 複数ラインの重ね合わせ
- インタラクティブなツールチップ

#### 軸設定
```typescript
// X軸: ラップ番号
{
  dataKey: 'lap_number',
  type: 'number',
  domain: [1, 'dataMax'],
  label: { value: 'Lap', position: 'insideBottom', offset: -5 },
  allowDecimals: false,
}

// Y軸: ラップタイム（秒）
{
  type: 'number',
  domain: ['dataMin - 5', 'dataMax + 5'],
  label: { value: 'Lap Time (s)', angle: -90, position: 'insideLeft' },
  tickFormatter: (value) => value.toFixed(1),
}
```

#### ライン設定
```typescript
// ドライバーごとにLineコンポーネント
{
  drivers.map(driver => (
    <Line
      key={driver.driver_number}
      type="monotone"
      dataKey={`driver_${driver.driver_number}`}
      stroke={`#${driver.team_colour}`}
      strokeWidth={selectedDrivers.includes(driver.driver_number) ? 3 : 1}
      dot={false} // 通常のラップはドット非表示
      activeDot={{ r: 6 }} // ホバー時は表示
      connectNulls={false} // ピットラップは接続しない
    />
  ))
}
```

#### ピットストップマーカー
```typescript
// カスタムドットでピットストップを表示
const CustomDot = (props: any) => {
  const { cx, cy, payload, dataKey } = props;
  const driverNumber = parseInt(dataKey.split('_')[1]);
  const isPitLap = pitStops.some(
    pit => pit.driver_number === driverNumber && pit.lap_number === payload.lap_number
  );

  if (!isPitLap) return null;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill="orange"
      stroke="white"
      strokeWidth={2}
    />
  );
};
```

#### ツールチップ
```typescript
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white p-4 border border-gray-200 rounded shadow-lg">
      <p className="font-bold">Lap {label}</p>
      {payload.map((entry: any) => {
        const driverNumber = parseInt(entry.dataKey.split('_')[1]);
        const driver = drivers.find(d => d.driver_number === driverNumber);
        const pitStop = pitStops.find(
          p => p.driver_number === driverNumber && p.lap_number === label
        );

        return (
          <div key={entry.dataKey} className="mt-2">
            <p style={{ color: entry.color }}>
              {driver?.name_acronym}: {entry.value.toFixed(3)}s
            </p>
            {pitStop && (
              <p className="text-sm text-orange-600">
                🔧 Pit: {pitStop.pit_duration.toFixed(1)}s
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
```

### 3.3 データ処理ロジック

#### ラップタイムデータの整形
```typescript
// ドライバー別にグループ化し、ピットアウトラップを除外
function processLapData(laps: Lap[], selectedDrivers: number[]) {
  const lapsByDriver = laps
    .filter(lap => selectedDrivers.includes(lap.driver_number))
    .reduce((acc, lap) => {
      if (!acc[lap.driver_number]) {
        acc[lap.driver_number] = [];
      }
      acc[lap.driver_number].push(lap);
      return acc;
    }, {} as Record<number, Lap[]>);

  // 全ラップ数を取得
  const maxLap = Math.max(...laps.map(l => l.lap_number));

  // ラップごとにデータを整形
  const chartData = [];
  for (let lapNum = 1; lapNum <= maxLap; lapNum++) {
    const dataPoint: any = { lap_number: lapNum };

    selectedDrivers.forEach(driverNum => {
      const lap = lapsByDriver[driverNum]?.find(l => l.lap_number === lapNum);

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
```

### 3.4 フィルタリング機能

#### ドライバーフィルタ
- URLパラメータ `drivers` から選択状態を取得
- 選択されたドライバーのみグラフに表示
- 選択解除されたドライバーは薄く表示（オプション）

#### ラップ範囲フィルタ
```typescript
interface LapRangeFilter {
  startLap: number;
  endLap: number;
}

// URLパラメータ: ?lapStart=10&lapEnd=30
const lapRange = {
  startLap: parseInt(searchParams.get('lapStart') || '1'),
  endLap: parseInt(searchParams.get('lapEnd') || String(maxLap)),
};
```

---

## 4. ピット戦略タイムライン

### 4.1 視覚表現

#### スティントバー
```
Driver 1: [SOFT████████] [MEDIUM████████████████] [SOFT████]
Driver 2: [MEDIUM███████████████] [SOFT███████████]
Driver 3: [SOFT█████] [HARD████████████████████████]
         Lap 1      10       20       30       40       50
```

### 4.2 UI仕様

#### コンポーネント構成
```typescript
<div className="space-y-2">
  {selectedDrivers.map(driverNum => {
    const driverStints = stints.filter(s => s.driver_number === driverNum);
    const driver = drivers.find(d => d.driver_number === driverNum);

    return (
      <div key={driverNum} className="flex items-center gap-2">
        {/* ドライバー情報 */}
        <div className="w-24 text-sm font-medium">
          {driver?.name_acronym}
        </div>

        {/* スティントバー */}
        <div className="flex-1 flex relative h-8">
          {driverStints.map(stint => {
            const width = ((stint.lap_end - stint.lap_start + 1) / maxLap) * 100;
            const left = ((stint.lap_start - 1) / maxLap) * 100;

            return (
              <div
                key={stint.stint_number}
                className="absolute h-full rounded"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  backgroundColor: getTyreColor(stint.compound),
                }}
                title={`${stint.compound} (Lap ${stint.lap_start}-${stint.lap_end})`}
              >
                <span className="text-xs text-white px-1">
                  {stint.compound[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  })}
</div>

// タイヤコンパウンド色
function getTyreColor(compound: TireCompound): string {
  const colors = {
    SOFT: '#FF0000',      // 赤
    MEDIUM: '#FFFF00',    // 黄
    HARD: '#FFFFFF',      // 白
    INTERMEDIATE: '#00FF00', // 緑
    WET: '#0000FF',       // 青
  };
  return colors[compound];
}
```

### 4.3 インタラクション

#### ホバー表示
```typescript
// スティントバーにホバーでツールチップ表示
<Tooltip>
  <TooltipTrigger asChild>
    <div className="stint-bar">...</div>
  </TooltipTrigger>
  <TooltipContent>
    <p>Compound: {stint.compound}</p>
    <p>Laps: {stint.lap_start} - {stint.lap_end}</p>
    <p>Stint Length: {stint.lap_end - stint.lap_start + 1} laps</p>
    <p>Tyre Age: {stint.tyre_age_at_start} laps old</p>
  </TooltipContent>
</Tooltip>
```

#### クリック操作
- スティントバーをクリック → 該当ラップ範囲にズーム
- URLパラメータを更新: `?lapStart=10&lapEnd=25`

---

## 5. アンダーカット・オーバーカット分析

### 5.1 定義

#### アンダーカット
先にピットインして新しいタイヤで追い抜く戦略
```
例:
Driver A: Lap 20でピット (15位 → 18位に一時降格)
Driver B: Lap 22でピット (14位)
→ Driver Aが新品タイヤで速いラップ → Lap 23に14位に浮上
→ アンダーカット成功
```

#### オーバーカット
後にピットインしてタイヤ温存で追い抜く戦略
```
例:
Driver A: Lap 20でピット
Driver B: Lap 25でピット (タイヤを長く使う)
→ Driver Bがピット後もDriver Aより前の順位
→ オーバーカット成功
```

### 5.2 判定ロジック

```typescript
interface PitStrategyAnalysis {
  driver1: number;
  driver2: number;
  type: 'undercut' | 'overcut';
  success: boolean;
  driver1PitLap: number;
  driver2PitLap: number;
  positionChange: number;
}

function analyzePitStrategy(
  positions: Position[],
  pitStops: PitStop[]
): PitStrategyAnalysis[] {
  const results: PitStrategyAnalysis[] = [];

  // ピット前後3ラップでの順位変動を分析
  pitStops.forEach(pit1 => {
    pitStops.forEach(pit2 => {
      if (pit1.driver_number === pit2.driver_number) return;
      if (Math.abs(pit1.lap_number - pit2.lap_number) > 5) return; // 近いラップのみ

      const lapDiff = pit2.lap_number - pit1.lap_number;
      if (lapDiff <= 0) return;

      // ピット前の順位
      const beforePos1 = positions.find(
        p => p.driver_number === pit1.driver_number &&
             p.lap_number === pit1.lap_number - 1
      )?.position;

      const beforePos2 = positions.find(
        p => p.driver_number === pit2.driver_number &&
             p.lap_number === pit1.lap_number - 1
      )?.position;

      // ピット後の順位（両方がピット後）
      const afterPos1 = positions.find(
        p => p.driver_number === pit1.driver_number &&
             p.lap_number === pit2.lap_number + 2
      )?.position;

      const afterPos2 = positions.find(
        p => p.driver_number === pit2.driver_number &&
             p.lap_number === pit2.lap_number + 2
      )?.position;

      if (!beforePos1 || !beforePos2 || !afterPos1 || !afterPos2) return;

      // アンダーカット判定（先にピットした方が順位を上げた）
      if (beforePos1 > beforePos2 && afterPos1 < afterPos2) {
        results.push({
          driver1: pit1.driver_number,
          driver2: pit2.driver_number,
          type: 'undercut',
          success: true,
          driver1PitLap: pit1.lap_number,
          driver2PitLap: pit2.lap_number,
          positionChange: beforePos1 - afterPos1,
        });
      }
    });
  });

  return results;
}
```

### 5.3 視覚化

#### グラフ上の表示
```typescript
// アンダーカット成功時のアノテーション
<ReferenceArea
  x1={strategy.driver1PitLap}
  x2={strategy.driver2PitLap + 2}
  y1="dataMin"
  y2="dataMax"
  fill="green"
  fillOpacity={0.1}
  label={{
    value: '🟢 Undercut Success',
    position: 'insideTop'
  }}
/>
```

#### サマリーカード
```typescript
<div className="bg-green-50 border border-green-200 rounded p-4">
  <h3 className="font-bold text-green-800">Undercut Success</h3>
  <p>
    {getDriver(strategy.driver1).name_acronym} undercut{' '}
    {getDriver(strategy.driver2).name_acronym}
  </p>
  <p className="text-sm text-gray-600">
    Lap {strategy.driver1PitLap} → {strategy.driver2PitLap}
    ({strategy.driver2PitLap - strategy.driver1PitLap} laps earlier)
  </p>
  <p className="text-sm text-gray-600">
    Position gained: {strategy.positionChange}
  </p>
</div>
```

---

## 6. タイヤデグラデーション分析

### 6.1 デグラデーション定義
タイヤの摩耗によるラップタイムの劣化

### 6.2 計算方法

```typescript
interface TyreDegradation {
  driver_number: number;
  stint_number: number;
  compound: TireCompound;
  degradation_per_lap: number; // 秒/ラップ
  total_degradation: number;   // スティント全体の劣化
  average_lap_time: number;
}

function calculateTyreDegradation(
  laps: Lap[],
  stints: Stint[]
): TyreDegradation[] {
  const results: TyreDegradation[] = [];

  stints.forEach(stint => {
    const stintLaps = laps.filter(
      lap =>
        lap.driver_number === stint.driver_number &&
        lap.lap_number >= stint.lap_start &&
        lap.lap_number <= stint.lap_end &&
        !lap.is_pit_out_lap &&
        lap.lap_duration !== null
    );

    if (stintLaps.length < 3) return; // 最低3ラップ必要

    // 線形回帰で劣化率を計算
    const lapNumbers = stintLaps.map(l => l.lap_number - stint.lap_start);
    const lapTimes = stintLaps.map(l => l.lap_duration);

    const degradationPerLap = calculateLinearRegression(lapNumbers, lapTimes).slope;
    const averageLapTime = lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length;
    const totalDegradation = degradationPerLap * (stint.lap_end - stint.lap_start);

    results.push({
      driver_number: stint.driver_number,
      stint_number: stint.stint_number,
      compound: stint.compound,
      degradation_per_lap: degradationPerLap,
      total_degradation: totalDegradation,
      average_lap_time: averageLapTime,
    });
  });

  return results;
}

// 線形回帰計算
function calculateLinearRegression(x: number[], y: number[]) {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}
```

### 6.3 視覚化

#### デグラデーショングラフ
```typescript
// スティントごとのラップタイム推移（劣化を可視化）
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={degradationData}>
    <XAxis
      dataKey="lap_in_stint"
      label={{ value: 'Laps on Tyre', position: 'insideBottom' }}
    />
    <YAxis
      label={{ value: 'Lap Time (s)', angle: -90, position: 'insideLeft' }}
    />
    <Tooltip content={<CustomDegradationTooltip />} />
    <Legend />

    {selectedDrivers.map(driverNum => (
      <Line
        key={driverNum}
        type="monotone"
        dataKey={`driver_${driverNum}`}
        stroke={getDriverColor(driverNum)}
        strokeWidth={2}
      />
    ))}

    {/* 劣化トレンドライン */}
    {selectedDrivers.map(driverNum => (
      <Line
        key={`${driverNum}_trend`}
        type="monotone"
        dataKey={`driver_${driverNum}_trend`}
        stroke={getDriverColor(driverNum)}
        strokeWidth={1}
        strokeDasharray="5 5"
        dot={false}
      />
    ))}
  </LineChart>
</ResponsiveContainer>
```

#### コンパウンド別比較テーブル
```typescript
<table className="w-full border-collapse">
  <thead>
    <tr className="bg-gray-100">
      <th>Driver</th>
      <th>Compound</th>
      <th>Avg Lap Time</th>
      <th>Degradation/Lap</th>
      <th>Total Degradation</th>
    </tr>
  </thead>
  <tbody>
    {degradationData.map(deg => (
      <tr key={`${deg.driver_number}_${deg.stint_number}`}>
        <td>{getDriver(deg.driver_number).name_acronym}</td>
        <td>
          <span
            className="px-2 py-1 rounded"
            style={{ backgroundColor: getTyreColor(deg.compound) }}
          >
            {deg.compound}
          </span>
        </td>
        <td>{deg.average_lap_time.toFixed(3)}s</td>
        <td>{deg.degradation_per_lap.toFixed(4)}s</td>
        <td>{deg.total_degradation.toFixed(3)}s</td>
      </tr>
    ))}
  </tbody>
</table>
```

---

## 7. ピットストップ詳細テーブル

### 7.1 表示項目

```typescript
interface PitStopDetail {
  driver_number: number;
  driver_name: string;
  lap_number: number;
  pit_duration: number;
  tyre_change: {
    from: TireCompound;
    to: TireCompound;
  };
  position_before: number;
  position_after: number;
  position_change: number;
  time_lost: number; // ピット時間 + 走行ロス
}
```

### 7.2 UI実装

```typescript
<div className="overflow-x-auto">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-4 py-2 text-left">Driver</th>
        <th className="px-4 py-2 text-left">Lap</th>
        <th className="px-4 py-2 text-left">Pit Duration</th>
        <th className="px-4 py-2 text-left">Tyre Change</th>
        <th className="px-4 py-2 text-left">Position</th>
        <th className="px-4 py-2 text-left">Time Lost</th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {pitStopDetails.map((pit, idx) => (
        <tr key={idx} className="hover:bg-gray-50">
          <td className="px-4 py-2">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: `#${getDriver(pit.driver_number).team_colour}` }}
              />
              {pit.driver_name}
            </div>
          </td>
          <td className="px-4 py-2">{pit.lap_number}</td>
          <td className="px-4 py-2">{pit.pit_duration.toFixed(2)}s</td>
          <td className="px-4 py-2">
            <div className="flex items-center gap-1">
              <span
                className="px-2 py-1 rounded text-xs"
                style={{ backgroundColor: getTyreColor(pit.tyre_change.from) }}
              >
                {pit.tyre_change.from[0]}
              </span>
              →
              <span
                className="px-2 py-1 rounded text-xs"
                style={{ backgroundColor: getTyreColor(pit.tyre_change.to) }}
              >
                {pit.tyre_change.to[0]}
              </span>
            </div>
          </td>
          <td className="px-4 py-2">
            <div className="flex items-center gap-1">
              P{pit.position_before} → P{pit.position_after}
              {pit.position_change > 0 && (
                <span className="text-green-600">+{pit.position_change}</span>
              )}
              {pit.position_change < 0 && (
                <span className="text-red-600">{pit.position_change}</span>
              )}
            </div>
          </td>
          <td className="px-4 py-2">{pit.time_lost.toFixed(1)}s</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### 7.3 ソート機能

```typescript
const [sortConfig, setSortConfig] = useState<{
  key: keyof PitStopDetail;
  direction: 'asc' | 'desc';
}>({ key: 'lap_number', direction: 'asc' });

const sortedPitStops = [...pitStopDetails].sort((a, b) => {
  if (a[sortConfig.key] < b[sortConfig.key]) {
    return sortConfig.direction === 'asc' ? -1 : 1;
  }
  if (a[sortConfig.key] > b[sortConfig.key]) {
    return sortConfig.direction === 'asc' ? 1 : -1;
  }
  return 0;
});
```

---

## 8. パフォーマンス最適化

### 8.1 データキャッシュ
```typescript
// React Queryでデータをキャッシュ
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10分（レース終了後は長期キャッシュ）
      cacheTime: 30 * 60 * 1000, // 30分
    },
  },
});
```

### 8.2 大量データの最適化
```typescript
// 仮想スクロール（長いテーブル用）
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: pitStopDetails.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50, // 行の高さ
});
```

### 8.3 グラフの最適化
```typescript
// useMemoでデータ処理を最適化
const chartData = useMemo(
  () => processLapData(laps, selectedDrivers),
  [laps, selectedDrivers]
);

const degradationData = useMemo(
  () => calculateTyreDegradation(laps, stints),
  [laps, stints]
);
```

---

## 9. レスポンシブデザイン

### 9.1 モバイル対応
```typescript
// グラフの高さをデバイスに応じて調整
const chartHeight = useMediaQuery('(min-width: 768px)') ? 400 : 250;

<ResponsiveContainer width="100%" height={chartHeight}>
  <LineChart data={chartData}>
    {/* ... */}
  </LineChart>
</ResponsiveContainer>
```

### 9.2 テーブルのスクロール
```typescript
// モバイルでは横スクロール可能に
<div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
  <table className="min-w-full">
    {/* ... */}
  </table>
</div>
```

---

## 10. エラーハンドリング

### 10.1 データ不在時
```typescript
if (!laps || laps.length === 0) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">このセッションのラップタイムデータは利用できません。</p>
    </div>
  );
}
```

### 10.2 ローディング状態
```typescript
if (isLoading) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
```

---

## 11. URLパラメータ仕様

### 11.1 パラメータ一覧
```
/race?
  year=2024
  &meeting=1234
  &session=5678
  &drivers=1,44,16         # 選択ドライバー
  &lapStart=1              # 表示範囲開始ラップ
  &lapEnd=58               # 表示範囲終了ラップ
  &compounds=SOFT,MEDIUM   # 表示タイヤコンパウンド
```

### 11.2 状態同期
```typescript
const [searchParams, setSearchParams] = useSearchParams();

// URLからフィルタ状態を復元
const selectedDrivers = useMemo(() => {
  const driversParam = searchParams.get('drivers');
  return driversParam ? driversParam.split(',').map(Number) : [];
}, [searchParams]);

// フィルタ変更時にURLを更新
const updateDriverSelection = (drivers: number[]) => {
  const newParams = new URLSearchParams(searchParams);
  newParams.set('drivers', drivers.join(','));
  setSearchParams(newParams);
};
```

---

## 12. テストケース

### 12.1 ユニットテスト
```typescript
describe('processLapData', () => {
  it('should filter pit out laps', () => {
    const laps = [
      { lap_number: 1, lap_duration: 95.5, is_pit_out_lap: false },
      { lap_number: 2, lap_duration: 120.0, is_pit_out_lap: true },
      { lap_number: 3, lap_duration: 94.8, is_pit_out_lap: false },
    ];
    const result = processLapData(laps, [1]);
    expect(result[1].driver_1).toBeNull(); // ピットアウトラップは除外
  });
});

describe('calculateTyreDegradation', () => {
  it('should calculate degradation per lap', () => {
    // テストデータでデグラデーション計算を検証
  });
});
```

---

## 13. 今後の拡張

- **リアルタイム更新**: WebSocketでライブデータ配信
- **比較モード**: 異なるレース間でのピット戦略比較
- **AI予測**: 次のピットタイミングを機械学習で予測
- **3D可視化**: サーキット上での位置情報と連動
