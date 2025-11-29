# F1 Dashboard

F1レースデータを可視化・分析するダッシュボードアプリケーション。

## プロジェクト構成

このリポジトリはモノレポ構成になっています。

*   **`frontend/`**: React + Vite によるフロントエンドアプリケーション
*   **`backend/`**: FastAPI + FastF1 によるバックエンドAPI
*   **`docs/`**: 設計ドキュメント、仕様書

## 開発の始め方

### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

### バックエンド

```bash
cd backend

# 仮想環境の作成と有効化 (推奨)
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係のインストール
pip install -r requirements.txt

# サーバー起動
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

**環境変数**:
バックエンドは環境変数不要で動作しますが、以下の設定が可能です：
- `PORT`: サーバーポート（デフォルト: 8080）

**APIドキュメント**:
サーバー起動後、以下のURLでSwagger UIにアクセスできます：
- http://localhost:8080/docs

**注意事項**:
- FastF1は初回データロード時にキャッシュを生成するため、最初のリクエストは時間がかかります（30〜60秒）
- キャッシュは `/tmp/fastf1_cache` に保存されます

### Docker を使った開発

Docker Composeを使用すると、環境構築が簡単になります：

```bash
# バックエンドをDockerで起動
o

# ログを確認
docker-compose logs -f backend

# 停止
docker-compose down

# キャッシュも含めて完全削除
docker-compose down -v
```

**メリット**:
- Python環境のセットアップ不要
- FastF1キャッシュが永続化される（Dockerボリューム）
- ホットリロード対応（コード変更が自動反映）

**APIドキュメント**: http://localhost:8080/docs

## フロントエンドとバックエンドの連携

フロントエンドからFastF1バックエンドを使用するには、`.env.local`を作成してください：

```bash
# frontend/.env.local
VITE_FASTF1_API_URL=http://localhost:8080
VITE_USE_FASTF1=true
```

これにより、ラップタイム分析がFastF1バックエンドから取得されるようになります。
