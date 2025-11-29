# FastF1 移行実装戦略

## 1. 概要
本ドキュメントは、OpenF1からFastF1 (Python Backend) への移行に関する具体的な実装手順と技術仕様を定義します。

## 2. システム構成

### 2.1 バックエンド (FastAPI)
*   **言語**: Python 3.11
*   **フレームワーク**: FastAPI
*   **データソース**: FastF1 (v3.3.0)
*   **サーバー**: Uvicorn (ASGI)
*   **コンテナ化**: Docker

### 2.2 インフラ (Google Cloud Run)
*   **サービス名**: `f1-dashboard-backend`
*   **リージョン**: `asia-northeast1` (Tokyo) 推奨
*   **メモリ**: 最小 1GB (FastF1のデータ処理用)
*   **スケーリング**: 0-5 インスタンス (コスト最適化)

## 3. API設計

### 3.1 エンドポイント定義

#### セッション情報
*   `GET /api/sessions/{year}`
    *   指定年の全セッションリストを取得。
    *   Response: `List[SessionSchema]`

#### ラップデータ
*   `GET /api/laps`
    *   Query: `year`, `meeting_key` (or `circuit_key`), `session_key`, `driver_number`
    *   **特徴**: FastF1の補正済みラップデータを返す。
    *   Response: `List[LapSchema]`

#### テレメトリーデータ (New)
*   `GET /api/telemetry`
    *   Query: `session_key`, `driver_number`, `lap_number`
    *   **特徴**: 指定ラップの詳細テレメトリー (Speed, RPM, Gear, Throttle, Brake, DRS) を返す。
    *   Response: `TelemetrySchema`

#### ギャップ分析 (New)
*   `GET /api/analysis/gap`
    *   Query: `session_key`, `driver_numbers` (comma separated)
    *   **特徴**: サーバーサイドで正確に計算されたギャップ推移データを返す。
    *   Response: `GapAnalysisSchema`

### 3.2 データモデル (Pydantic Schemas)

```python
class LapSchema(BaseModel):
    lap_number: int
    driver_number: int
    lap_time: float | None  # seconds
    sector1_time: float | None
    sector2_time: float | None
    sector3_time: float | None
    compound: str | None
    tyre_life: int | None
    is_pit_out: bool

class TelemetryPoint(BaseModel):
    date: datetime
    speed: int
    rpm: int
    gear: int
    throttle: int
    brake: bool
    drs: int
    distance: float
    rel_distance: float  # 0.0 to 1.0 (normalized lap distance)
```

## 4. キャッシュ戦略

FastF1は初回データロードに時間がかかるため、キャッシュが必須です。

### 4.1 ローカルキャッシュ (開発・小規模)
*   FastF1標準のファイルベースキャッシュを使用。
*   パス: `./cache`
*   Docker起動時はVolumeマウントを推奨。

### 4.2 Cloud Run でのキャッシュ
Cloud Runはステートレスであるため、ローカルファイルはインスタンス再起動で消えます。
*   **対策A (簡易)**: メモリキャッシュ (`/tmp` へのマウント) を使用。ただしインスタンスごとにキャッシュ生成が必要。
*   **対策B (推奨)**: 外部ストレージ (GCS) または Redis を使用するカスタムキャッシュバックエンドの実装。
    *   *Phase 1では対策Aを採用し、必要に応じて対策Bへ移行。*

## 5. デプロイメントフロー

### 5.1 Docker Build & Run (Local)
```bash
cd backend
docker build -t f1-backend .
docker run -p 8000:8080 -v $(pwd)/cache:/app/cache f1-backend
```

### 5.2 Cloud Run Deploy
```bash
gcloud run deploy f1-dashboard-backend \
  --source ./backend \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --memory 1Gi
```

## 6. フロントエンド移行計画

### Step 1: API Client の作成
*   `src/lib/api/fastf1/client.ts` を作成。
*   OpenF1クライアントと同じインターフェースを持つが、エンドポイント先が自社バックエンドになる。

### Step 2: Hooks の差し替え
*   `useF1Data.ts` 内のフック (`useLaps`, `useTelemetry`) を、フラグ切り替えで新APIを使用するように改修。
    ```typescript
    const USE_FASTF1 = true; // Feature Flag
    ```

### Step 3: コンポーネントの調整
*   データ構造の微細な違い（例: キー名の違い `lap_duration` -> `lap_time`）を吸収するアダプター層を実装。

## 7. 開発ロードマップ

1.  **Backend Setup**: FastAPIプロジェクト作成、Docker化 (完了)
2.  **Core API Impl**: セッション、ラップ取得の実装
3.  **Frontend Integration**: ラップタイムチャートのデータソース切り替え
4.  **Telemetry Impl**: テレメトリーAPIの実装とチャート連携
5.  **Cloud Deploy**: Cloud Runへのデプロイと動作確認
