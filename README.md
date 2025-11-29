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
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係のインストール
pip install -r requirements.txt

# サーバー起動
uvicorn main:app --reload
```
