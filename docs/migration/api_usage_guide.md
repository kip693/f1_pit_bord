# FastF1 Backend API 使用ガイド

## 概要
FastF1 Backend APIは、F1レースデータを提供するRESTful APIです。FastF1 Pythonライブラリを使用して、ラップタイム、テレメトリー、ドライバー情報などを取得できます。

## ベースURL
- **ローカル開発**: `http://localhost:8080`
- **本番環境**: `https://YOUR_CLOUD_RUN_URL` (Cloud Run URLに置き換えてください)

## 認証
現在、認証は不要です（開発段階）。

---

## エンドポイント一覧

### 1. ヘルスチェック

#### `GET /health`
APIの稼働状態を確認します。

**レスポンス例**:
```json
{
  "status": "healthy"
}
```

**curlコマンド例**:
```bash
curl http://localhost:8080/health
```

---

### 2. ラップデータ取得

#### `GET /api/laps`
指定したセッションのラップデータを取得します。

**クエリパラメータ**:
| パラメータ | 型 | 必須 | 説明 | 例 |
|:---|:---|:---|:---|:---|
| `year` | int | ✅ | レース年 | `2024` |
| `event` | string | ✅ | イベント名またはラウンド番号 | `"Bahrain"` または `1` |
| `session_type` | string | ✅ | セッションタイプ | `"R"` (Race), `"Q"` (Qualifying), `"FP1"` など |
| `driver_number` | int | ❌ | ドライバー番号（フィルター用） | `1` (Verstappen) |

**レスポンス例**:
```json
[
  {
    "meeting_key": 0,
    "session_key": 0,
    "driver_number": 1,
    "lap_number": 1,
    "lap_duration": 90.123,
    "duration_sector_1": 28.456,
    "duration_sector_2": 35.789,
    "duration_sector_3": 25.878,
    "compound": "SOFT",
    "tyre_life": 1,
    "is_pit_out_lap": false,
    "i1_speed": 305,
    "i2_speed": 285,
    "st_speed": 310,
    "date_start": "2024-03-02T15:00:00"
  }
]
```

**curlコマンド例**:
```bash
# 全ドライバーのラップデータ
curl "http://localhost:8080/api/laps?year=2024&event=Bahrain&session_type=R"

# 特定ドライバー（Verstappen）のみ
curl "http://localhost:8080/api/laps?year=2024&event=1&session_type=R&driver_number=1"
```

**JavaScriptでの使用例**:
```javascript
const response = await fetch(
  'http://localhost:8080/api/laps?year=2024&event=Bahrain&session_type=R&driver_number=1'
);
const laps = await response.json();
```

---

### 3. テレメトリーデータ取得

#### `GET /api/telemetry`
指定したラップの詳細テレメトリーデータを取得します。

**クエリパラメータ**:
| パラメータ | 型 | 必須 | 説明 | 例 |
|:---|:---|:---|:---|:---|
| `year` | int | ✅ | レース年 | `2024` |
| `event` | string | ✅ | イベント名 | `"Bahrain"` |
| `session_type` | string | ✅ | セッションタイプ | `"R"` |
| `driver_number` | int | ✅ | ドライバー番号 | `1` |
| `lap_number` | int | ✅ | ラップ番号 | `10` |

**レスポンス例**:
```json
[
  {
    "date": "2024-03-02T15:05:23.123",
    "speed": 305,
    "rpm": 11500,
    "gear": 8,
    "throttle": 100,
    "brake": false,
    "drs": 1,
    "distance": 1234.56,
    "rel_distance": 0.25
  },
  {
    "date": "2024-03-02T15:05:23.223",
    "speed": 280,
    "rpm": 10800,
    "gear": 7,
    "throttle": 85,
    "brake": true,
    "drs": 0,
    "distance": 1256.78,
    "rel_distance": 0.26
  }
]
```

**curlコマンド例**:
```bash
curl "http://localhost:8080/api/telemetry?year=2024&event=Bahrain&session_type=R&driver_number=1&lap_number=10"
```

**JavaScriptでの使用例**:
```javascript
const response = await fetch(
  'http://localhost:8080/api/telemetry?year=2024&event=Bahrain&session_type=R&driver_number=1&lap_number=10'
);
const telemetry = await response.json();
```

---

### 4. ドライバー情報取得

#### `GET /api/drivers`
指定したセッションのドライバー情報を取得します。

**クエリパラメータ**:
| パラメータ | 型 | 必須 | 説明 | 例 |
|:---|:---|:---|:---|:---|
| `year` | int | ✅ | レース年 | `2024` |
| `event` | string | ✅ | イベント名 | `"Bahrain"` |
| `session_type` | string | ✅ | セッションタイプ | `"R"` |

**レスポンス例**:
```json
[
  {
    "driver_number": 1,
    "name_acronym": "VER",
    "full_name": "Max Verstappen",
    "team_name": "Red Bull Racing",
    "team_colour": "3671C6"
  },
  {
    "driver_number": 44,
    "name_acronym": "HAM",
    "full_name": "Lewis Hamilton",
    "team_name": "Mercedes",
    "team_colour": "27F4D2"
  }
]
```

**curlコマンド例**:
```bash
curl "http://localhost:8080/api/drivers?year=2024&event=Bahrain&session_type=R"
```

---

## セッションタイプ一覧

| コード | 説明 |
|:---|:---|
| `FP1` | Free Practice 1 |
| `FP2` | Free Practice 2 |
| `FP3` | Free Practice 3 |
| `Q` | Qualifying |
| `SQ` | Sprint Qualifying |
| `S` | Sprint Race |
| `R` | Race |

---

## イベント指定方法

イベントは以下の2つの方法で指定できます：

1. **イベント名**: `"Bahrain"`, `"Saudi Arabia"`, `"Australia"` など
2. **ラウンド番号**: `1`, `2`, `3` など（シーズンの順番）

**例**:
- `event=Bahrain` または `event=1` (2024年シーズンの第1戦)
- `event=Monaco` または `event=8` (モナコGP)

---

## エラーハンドリング

APIはエラー時に以下の形式でレスポンスを返します：

```json
{
  "detail": "Failed to fetch laps: Session not found"
}
```

**HTTPステータスコード**:
- `200`: 成功
- `400`: リクエストパラメータが不正
- `404`: データが見つからない
- `500`: サーバーエラー

---

## 注意事項

1. **初回リクエストの遅延**: FastF1は初回データロード時にキャッシュを生成するため、最初のリクエストは30〜60秒かかる場合があります。
2. **キャッシュ**: 一度取得したデータはキャッシュされるため、2回目以降は高速にレスポンスが返ります。
3. **タイムアウト**: APIのタイムアウトは60秒に設定されています。

---

## フロントエンドでの使用例

### TypeScript (React)

```typescript
import { getFastF1 } from '@/lib/api/fastf1/client';
import type { FastF1Lap } from '@/lib/api/fastf1/types';

// ラップデータ取得
const laps = await getFastF1<FastF1Lap[]>('/api/laps', {
  year: 2024,
  event: 'Bahrain',
  session_type: 'R',
  driver_number: 1,
});

console.log(laps);
```

### React Hook

```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchLaps } from '@/lib/api/fastf1';

function MyComponent() {
  const { data: laps, isLoading } = useQuery({
    queryKey: ['laps', 2024, 'Bahrain', 'R', 1],
    queryFn: () => fetchLaps({
      year: 2024,
      event: 'Bahrain',
      session_type: 'R',
      driver_number: 1,
    }),
  });

  if (isLoading) return <div>Loading...</div>;
  return <div>{laps?.length} laps loaded</div>;
}
```
