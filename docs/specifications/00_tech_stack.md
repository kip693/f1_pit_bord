# 技術スタック仕様書

## 1. 概要
本ドキュメントは、F1 Dashboardプロジェクトで使用する技術スタックとその選定理由を定義します。

---

## 2. アーキテクチャ概要

### 2.1 アプリケーション種別
- **SPA (Single Page Application)**
  - クライアントサイドレンダリング
  - 静的ホスティング可能
  - リアルタイムデータ可視化に最適

### 2.2 アーキテクチャ図
```
┌─────────────────────────────────────────┐
│         Static Hosting Service          │
│   (Cloudflare Pages / Netlify)          │
└───────────────┬─────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────┐
│        React SPA (Vite Build)            │
│  ┌─────────────────────────────────┐   │
│  │  React Router v7                 │   │
│  │  - ルーティング                    │   │
│  │  - URLパラメータ管理               │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  TanStack Query                  │   │
│  │  - データフェッチ                   │   │
│  │  - キャッシュ管理                   │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Zustand                         │   │
│  │  - UI状態管理                      │   │
│  │  - フィルタ状態管理                 │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Recharts / D3.js                │   │
│  │  - データ可視化                     │   │
│  └─────────────────────────────────┘   │
└───────────────┬─────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────┐
│         Open F1 API                      │
│   https://api.openf1.org/v1              │
└─────────────────────────────────────────┘
```

---

## 3. コア技術

### 3.1 React 18
- **バージョン**: 18.3.x
- **選定理由**:
  - 豊富なエコシステム
  - 高いパフォーマンス（Concurrent Features）
  - コンポーネントベースの再利用性
  - 大規模なコミュニティサポート

- **使用機能**:
  - Hooks (useState, useEffect, useMemo, useCallback)
  - Suspense（ローディング処理）
  - Error Boundaries（エラーハンドリング）
  - Concurrent Rendering

### 3.2 TypeScript
- **バージョン**: 5.x
- **選定理由**:
  - 型安全性によるバグの早期発見
  - IDEサポート（自動補完、リファクタリング）
  - APIレスポンスの型定義で開発効率向上
  - チーム開発時の保守性

- **設定**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 4. ルーティング

### 4.1 React Router v7
- **バージョン**: 7.x
- **選定理由**:
  - Next.jsと比較してよりシンプル
  - SSRが不要なSPAに最適
  - URLパラメータ管理が直感的
  - ネストされたルートのサポート
  - データローダー機能
  - 軽量で高速

- **主な機能**:
  - File-based routing（オプション）
  - Loaders & Actions
  - Nested Routes
  - URL Search Params管理

- **ルート構成例**:
```typescript
// src/router.tsx
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'race',
        element: <RaceAnalysisPage />,
        loader: raceLoader,
      },
      {
        path: 'qualifying',
        element: <QualifyingAnalysisPage />,
        loader: qualifyingLoader,
      },
    ],
  },
]);
```

### 4.2 Next.js を使わない理由
| 要件 | Next.js | React Router v7 |
|------|---------|-----------------|
| SSR/SSG | 必要 | 不要（Open F1 APIからクライアントフェッチ） |
| SEO | 強い | F1分析ツールにはSEO不要 |
| APIルート | あり | 不要（直接API呼び出し） |
| 複雑性 | 高い（App Router等） | 低い |
| デプロイ | サーバー必要な場合あり | 静的ファイルでOK |
| 学習コスト | 高い | 低い |

---

## 5. ビルドツール

### 5.1 Vite
- **バージョン**: 5.x
- **選定理由**:
  - 高速なHMR（Hot Module Replacement）
  - 最適化されたビルド
  - プラグインエコシステム
  - TypeScriptネイティブサポート
  - React Router v7との相性が良い

- **主な設定**:
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts': ['recharts', 'd3'],
          'data': ['@tanstack/react-query', 'axios'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
```

---

## 6. データフェッチング

### 6.1 TanStack Query (React Query)
- **バージョン**: 5.x
- **選定理由**:
  - 強力なキャッシュ機構
  - 自動リフェッチ・再検証
  - ローディング・エラー状態の管理
  - オフライン対応
  - Devtools（開発時のデバッグ）

- **主な機能**:
  - `useQuery` - データ取得
  - `useMutation` - データ更新（将来の拡張用）
  - Query Invalidation - キャッシュの無効化
  - Optimistic Updates

- **設定例**:
```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分
      cacheTime: 10 * 60 * 1000, // 10分
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

### 6.2 Axios
- **バージョン**: 1.x
- **選定理由**:
  - インターセプター（エラーハンドリング、ログ）
  - リクエスト/レスポンスの変換
  - タイムアウト設定
  - キャンセル機能

---

## 7. 状態管理

### 7.1 Zustand
- **バージョン**: 4.x
- **選定理由**:
  - シンプルで学習コストが低い
  - ボイラープレートが少ない
  - TypeScriptとの相性が良い
  - パフォーマンスが高い
  - Redux Toolkit より軽量

- **使用用途**:
  - フィルタ状態（ドライバー、チーム選択）
  - UI状態（サイドバー開閉、モーダル）
  - ユーザー設定（お気に入りドライバー）

- **ストア例**:
```typescript
// src/store/filterStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FilterState {
  selectedDriverNumbers: number[];
  favoriteDriverNumbers: number[];
  setSelectedDrivers: (drivers: number[]) => void;
  toggleFavorite: (driverNumber: number) => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      selectedDriverNumbers: [],
      favoriteDriverNumbers: [],
      setSelectedDrivers: (drivers) =>
        set({ selectedDriverNumbers: drivers }),
      toggleFavorite: (driverNumber) =>
        set((state) => ({
          favoriteDriverNumbers: state.favoriteDriverNumbers.includes(driverNumber)
            ? state.favoriteDriverNumbers.filter(n => n !== driverNumber)
            : [...state.favoriteDriverNumbers, driverNumber],
        })),
    }),
    {
      name: 'f1-dashboard-filters',
    }
  )
);
```

### 7.2 TanStack Queryとの役割分担
| 用途 | 使用ツール |
|------|-----------|
| サーバー状態（APIデータ） | TanStack Query |
| UI状態（フィルタ、設定） | Zustand |
| URLパラメータ | React Router |

---

## 8. スタイリング

### 8.1 Tailwind CSS
- **バージョン**: 3.x
- **選定理由**:
  - ユーティリティファーストで開発速度が速い
  - レスポンシブデザインが簡単
  - カスタマイズ性が高い
  - ビルド時に未使用CSSを削除（小さいバンドルサイズ）
  - F1チームカラーのカスタマイズが容易

- **設定例**:
```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // F1チームカラー
        'redbull': '#3671C6',
        'ferrari': '#E8002D',
        'mercedes': '#27F4D2',
        'mclaren': '#FF8000',
        // ... その他のチーム
      },
      fontFamily: {
        'f1': ['Formula1', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### 8.2 追加ライブラリ
- **clsx / classnames**: クラス名の条件付き結合
- **tailwind-merge**: Tailwindクラスの競合解決

---

## 9. 可視化ライブラリ

### 9.1 Recharts
- **バージョン**: 2.x
- **選定理由**:
  - Reactコンポーネントベース
  - 宣言的なAPI
  - レスポンシブ対応
  - アニメーション機能
  - TypeScriptサポート

- **使用チャート**:
  - LineChart（ラップタイム推移）
  - BarChart（セクタータイム比較）
  - AreaChart（ギャップタイム）
  - ScatterChart（タイヤデグラデーション）
  - ComposedChart（複合グラフ）

### 9.2 D3.js
- **バージョン**: 7.x
- **使用用途**:
  - カスタムビジュアライゼーション
  - サーキットマップ上のヒートマップ
  - 複雑なインタラクティブグラフ
  - データ変換・計算

### 9.3 その他ビジュアル関連
- **react-intersection-observer**: 遅延ロード
- **framer-motion**: アニメーション

---

## 10. 開発ツール

### 10.1 Linting & Formatting
```json
{
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.57.0",
    "eslint-plugin-react": "^7.34.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^3.2.0",
    "prettier-plugin-tailwindcss": "^0.5.0"
  }
}
```

### 10.2 Testing
- **Vitest**: ユニットテスト
- **React Testing Library**: コンポーネントテスト
- **MSW (Mock Service Worker)**: APIモック

### 10.3 その他
- **React DevTools**: Reactデバッグ
- **TanStack Query DevTools**: クエリデバッグ
- **Zustand DevTools**: 状態デバッグ

---

## 11. デプロイ

### 11.1 Vercel デプロイ
- **ホスティング**: Vercel
- **選定理由**:
  - GitHub連携で自動デプロイ
  - プレビュー環境の自動生成
  - 高速なエッジネットワーク
  - 簡単な環境変数管理
  - 無料枠で十分な性能

### 11.2 Vercel設定

#### プロジェクト設定
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### ビルドコマンド
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx}\""
  }
}
```

### 11.3 環境変数設定

#### Vercel Dashboard での設定
- `VITE_API_BASE_URL`: `https://api.openf1.org/v1`
- `VITE_ENABLE_ANALYTICS`: `true` (本番環境のみ)

#### ローカル開発用
```bash
# .env.local
VITE_API_BASE_URL=https://api.openf1.org/v1
VITE_ENABLE_ANALYTICS=false
```

```bash
# .env.production
VITE_API_BASE_URL=https://api.openf1.org/v1
VITE_ENABLE_ANALYTICS=true
```

### 11.4 デプロイフロー

#### 自動デプロイ
1. **本番**: `main` ブランチへのマージで自動デプロイ
2. **プレビュー**: Pull Request作成時に自動プレビュー環境生成
3. **開発**: feature ブランチごとのプレビュー環境

#### 手動デプロイ
```bash
# Vercel CLIインストール
npm i -g vercel

# 初回デプロイ
vercel

# 本番デプロイ
vercel --prod
```

### 11.5 パフォーマンス設定

#### ヘッダー設定
```json
// vercel.json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

## 12. パッケージ依存関係まとめ

### 12.1 主要パッケージ
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.0.0",
    "@tanstack/react-query": "^5.28.0",
    "zustand": "^4.5.0",
    "axios": "^1.6.0",
    "recharts": "^2.12.0",
    "d3": "^7.9.0",
    "tailwindcss": "^3.4.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "date-fns": "^3.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.1.0",
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/d3": "^7.4.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.0",
    "vitest": "^1.3.0",
    "@testing-library/react": "^14.2.0",
    "msw": "^2.1.0"
  }
}
```

---

## 13. ディレクトリ構成

```
f1_dashboard/
├── public/                  # 静的ファイル
│   ├── fonts/              # F1フォント
│   └── images/             # サーキット画像等
├── src/
│   ├── components/         # Reactコンポーネント
│   │   ├── common/        # 共通コンポーネント
│   │   ├── charts/        # グラフコンポーネント
│   │   ├── filters/       # フィルタコンポーネント
│   │   └── layouts/       # レイアウト
│   ├── pages/             # ページコンポーネント
│   │   ├── HomePage.tsx
│   │   ├── RaceAnalysisPage.tsx
│   │   └── QualifyingAnalysisPage.tsx
│   ├── lib/               # ライブラリ・ユーティリティ
│   │   ├── api/          # API関連
│   │   │   ├── client.ts
│   │   │   ├── f1/       # Open F1 API
│   │   │   └── types.ts
│   │   ├── hooks/        # カスタムフック
│   │   └── utils/        # ユーティリティ関数
│   ├── store/            # Zustandストア
│   ├── router.tsx        # ルーティング定義
│   ├── App.tsx
│   └── main.tsx
├── tests/                # テスト
├── docs/                 # ドキュメント
│   └── specifications/   # 仕様書
├── .env.example
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 14. パフォーマンス最適化戦略

### 14.1 コード分割
- React.lazy + Suspense
- Dynamic import
- Route-based code splitting

### 14.2 データ最適化
- TanStack Query のキャッシュ
- Virtual scrolling（react-window）
- Memoization（useMemo, React.memo）

### 14.3 アセット最適化
- 画像の最適化（WebP）
- Font subsetting
- Tree shaking

### 14.4 目標指標
- **Lighthouse Score**: 90以上
- **First Contentful Paint**: 1.5秒以内
- **Time to Interactive**: 3秒以内

---

## 15. ブラウザ対応

| ブラウザ | 最小バージョン |
|---------|---------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |
| iOS Safari | 14+ |
| Chrome Android | 90+ |

---

## 16. 今後の技術的拡張

- **PWA対応**: Service Worker導入
- **WebSocket**: リアルタイムデータ配信
- **WebGL**: 3Dサーキット表示
- **Web Workers**: 重い計算処理のオフロード
