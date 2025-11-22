# F1 Dashboard Design System

## コンセプト

F1ピットウォールに表示されるプロフェッショナルなデータビジュアライゼーションをイメージした、高密度で視認性の高いデザインシステム。

**キーワード**: テクニカル、高精度、リアルタイム、プロフェッショナル

---

## カラーパレット

### プライマリーカラー

```css
/* F1レッドアクセント */
--f1-red: #E10600;
--f1-red-light: #FF1E1E;
--f1-red-dark: #B30500;

/* ダークベース */
--dark-bg: #0A0A0A;
--dark-surface: #1A1A1A;
--dark-elevated: #2A2A2A;

/* グレースケール */
--gray-900: #0F172A;
--gray-800: #1E293B;
--gray-700: #334155;
--gray-600: #475569;
--gray-500: #64748B;
--gray-400: #94A3B8;
--gray-300: #CBD5E1;
--gray-200: #E2E8F0;
--gray-100: #F1F5F9;
--gray-50: #F8FAFC;
```

### データビジュアライゼーションカラー

```css
/* ドライバー比較用 */
--driver-1: #2563EB; /* Blue */
--driver-2: #DC2626; /* Red */
--driver-3: #16A34A; /* Green */
--driver-4: #9333EA; /* Purple */
--driver-5: #EA580C; /* Orange */

/* テレメトリーデータ */
--telemetry-speed: #2563EB;
--telemetry-rpm: #DC2626;
--telemetry-throttle: #16A34A;
--telemetry-brake: #9333EA;
--telemetry-gear: #EA580C;

/* ステータスカラー */
--status-success: #10B981;
--status-warning: #F59E0B;
--status-error: #EF4444;
--status-info: #3B82F6;
```

### セクターカラー

```css
--sector-1: #FEF3C7; /* Yellow tint */
--sector-2: #DBEAFE; /* Blue tint */
--sector-3: #FCE7F3; /* Pink tint */
```

---

## タイポグラフィ

### フォントファミリー

```css
/* プライマリ: 数値・データ表示 */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* モノスペース: タイムデータ */
font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
```

### フォントサイズスケール

```css
/* ヘッダー */
--text-3xl: 1.875rem;  /* 30px - ページタイトル */
--text-2xl: 1.5rem;    /* 24px - セクションタイトル */
--text-xl: 1.25rem;    /* 20px - サブセクション */
--text-lg: 1.125rem;   /* 18px - 強調テキスト */

/* ボディ */
--text-base: 1rem;     /* 16px - 標準テキスト */
--text-sm: 0.875rem;   /* 14px - 補助テキスト */
--text-xs: 0.75rem;    /* 12px - ラベル・キャプション */
--text-2xs: 0.625rem;  /* 10px - 極小ラベル */
```

### フォントウェイト

```css
--font-bold: 700;      /* タイトル、重要データ */
--font-semibold: 600;  /* サブタイトル */
--font-medium: 500;    /* ラベル */
--font-normal: 400;    /* 本文 */
```

---

## スペーシング

### 基本スケール（4pxベース）

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
```

---

## コンポーネントパターン

### 1. データカード（基本）

**用途**: 統計情報、KPI表示

```tsx
<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
  <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
    タイトル
  </h3>
  <p className="text-2xl font-bold text-gray-900">データ値</p>
  <p className="text-xs text-gray-500 mt-1">補足情報</p>
</div>
```

**特徴**:
- 白背景 + 軽いシャドウ
- 角丸: `rounded-lg` (8px)
- ボーダー: `border-gray-200`
- パディング: `p-6` (24px)

### 2. プレミアムカード（グラデーション）

**用途**: 重要な選択UI、ドライバー選択

```tsx
<div className="relative overflow-hidden rounded-xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm transition-all hover:shadow-md">
  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
  <div className="relative">
    {/* コンテンツ */}
  </div>
</div>
```

**特徴**:
- グラデーション背景
- 装飾的な円形要素
- ホバー時のシャドウ変化
- 2pxボーダー

### 3. インタラクティブボタン

**用途**: アクション実行、データ選択

```tsx
{/* プライマリボタン */}
<button className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transition-all transform hover:scale-105 uppercase tracking-wide">
  アクション
</button>

{/* セカンダリボタン */}
<button className="px-4 py-2 border-2 border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all">
  キャンセル
</button>
```

**特徴**:
- グラデーション背景（プライマリ）
- ホバー時の拡大アニメーション
- 大文字 + レタースペーシング
- シャドウの変化

### 4. トグルカード

**用途**: オプション選択、フィルター

```tsx
<label className={`relative flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-105 ${
  isActive 
    ? 'border-blue-400 bg-blue-50 shadow-md' 
    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
}`}>
  <input type="checkbox" className="sr-only" />
  <span className="text-2xl">🏎️</span>
  <span className={`text-xs font-bold uppercase tracking-wide ${
    isActive ? 'text-blue-700' : 'text-gray-600'
  }`}>ラベル</span>
  {isActive && (
    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  )}
</label>
```

**特徴**:
- アクティブ状態で背景色変化
- チェックマークバッジ
- 絵文字アイコン
- ホバー時の拡大

### 5. フォーム要素

**用途**: データ入力、選択

```tsx
{/* セレクトボックス */}
<select className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200">
  <option>選択...</option>
</select>

{/* インプット */}
<input 
  type="text" 
  className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
  placeholder="入力..."
/>
```

**特徴**:
- 2pxボーダー
- フォーカス時のリング効果
- ホバー時のボーダー色変化
- 十分なパディング（py-3）

---

## レイアウトパターン

### セクション構造

```tsx
<section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
  {/* ヘッダー */}
  <div className="mb-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-2">
      セクションタイトル
    </h2>
    <p className="text-sm text-gray-600">
      説明文
    </p>
  </div>
  
  {/* コンテンツ */}
  <div className="space-y-6">
    {/* 子要素 */}
  </div>
</section>
```

### グリッドレイアウト

```tsx
{/* 2カラム（レスポンシブ） */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* カード */}
</div>

{/* 5カラム（系列選択など） */}
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
  {/* トグルカード */}
</div>
```

---

## アニメーション・トランジション

### 基本トランジション

```css
transition-all duration-200 ease-in-out
```

### ホバーエフェクト

```tsx
{/* スケール */}
className="transform hover:scale-105 transition-all"

{/* シャドウ */}
className="shadow-sm hover:shadow-md transition-all"

{/* ボーダー */}
className="border-gray-200 hover:border-blue-300 transition-all"
```

---

## アイコン使用ガイドライン

### SVGアイコン

- **サイズ**: `w-4 h-4` (16px) または `w-5 h-5` (20px)
- **ストローク**: `strokeWidth={2}`
- **カラー**: `currentColor` を使用して親要素から継承

### 絵文字アイコン

- **サイズ**: `text-2xl` (24px)
- **用途**: トグルカード、カテゴリ識別
- **例**: 🏎️ (Speed), ⚙️ (RPM), ⬆️ (Throttle), 🛑 (Brake), 🔢 (Gear)

---

## データビジュアライゼーション

### チャート共通スタイル

```tsx
{/* グリッド */}
<CartesianGrid strokeDasharray="3 3" stroke="#b3b3b3" />

{/* ツールチップ */}
<Tooltip
  contentStyle={{
    borderRadius: '8px',
    border: 'none',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    backgroundColor: '#ffffff'
  }}
  labelStyle={{ color: '#1f2937', fontWeight: 'bold' }}
/>

{/* レジェンド */}
<Legend 
  wrapperStyle={{ paddingTop: '16px' }}
  iconType="circle"
/>
```

### ライン色

- **ドライバー1**: `#2563EB` (Blue) - 実線
- **ドライバー2**: `#DC2626` (Red) - 破線 `strokeDasharray="5 5"`
- **ストローク幅**: データの重要度に応じて `1.5px` ~ `2px`

---

## レスポンシブデザイン

### ブレークポイント

```css
/* Tailwind デフォルト */
sm: 640px   /* タブレット縦 */
md: 768px   /* タブレット横 */
lg: 1024px  /* デスクトップ */
xl: 1280px  /* 大画面 */
2xl: 1536px /* 超大画面 */
```

### モバイル最適化

- **フォントサイズ**: モバイルでは1段階小さく
- **パディング**: `p-4` (モバイル) → `p-6` (デスクトップ)
- **グリッド**: `grid-cols-1` (モバイル) → `grid-cols-2+` (デスクトップ)

---

## アクセシビリティ

### コントラスト比

- **テキスト**: 最低 4.5:1 (WCAG AA)
- **大きなテキスト**: 最低 3:1
- **インタラクティブ要素**: 明確なフォーカス状態

### キーボードナビゲーション

```tsx
{/* フォーカス可能な要素 */}
className="focus:outline-none focus:ring-2 focus:ring-blue-500"

{/* スクリーンリーダー専用 */}
className="sr-only"
```

---

## 実装例

### ドライバー選択カード

```tsx
<div className="relative overflow-hidden rounded-xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm transition-all hover:shadow-md">
  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
  <div className="relative">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-3 h-3 rounded-full bg-blue-600"></div>
      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">ドライバー 1</h3>
    </div>
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">ドライバー</label>
        <select className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200">
          <option>VER</option>
        </select>
      </div>
    </div>
  </div>
</div>
```

---

## まとめ

このデザインシステムは、F1ピットウォールの**プロフェッショナル**で**高密度**なデータ表示を実現するために設計されています。

**重要原則**:
1. **視認性優先**: データが一目で理解できること
2. **一貫性**: 同じ要素には同じスタイルを適用
3. **階層構造**: 重要度に応じた視覚的な重み付け
4. **レスポンシブ**: あらゆるデバイスで最適な表示
5. **アクセシビリティ**: すべてのユーザーが利用可能

---

**更新履歴**:
- 2025-11-22: 初版作成
