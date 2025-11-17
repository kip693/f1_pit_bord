# 共通機能仕様書

## 1. 概要
本ドキュメントは、F1 Dashboardアプリケーション全体で使用される共通機能の詳細仕様を定義します。

## 2. レース/セッション選択機能

### 2.1 目的
ユーザーが分析したいシーズン、グランプリ、セッションを選択できる機能を提供する。

### 2.2 機能要件

#### 2.2.1 選択階層
```
シーズン（年）
  └── グランプリ（レース）
        └── セッション（FP1/FP2/FP3/予選/本戦/スプリント等）
```

#### 2.2.2 UI要件
- **シーズン選択**
  - ドロップダウンまたはタブ形式
  - 利用可能なシーズン一覧を降順で表示（最新年が上）
  - デフォルト: 現在のシーズン

- **グランプリ選択**
  - カード形式またはリスト形式
  - 表示項目:
    - サーキット名
    - 国名・都市名
    - 開催日
    - サーキット画像（オプション）
  - ソート: 開催日順（デフォルト）
  - フィルタリング: サーキット名・国名による検索

- **セッション選択**
  - タブ形式またはボタングループ
  - 表示項目:
    - セッション名（Practice 1/2/3, Qualifying, Sprint, Race）
    - 開催日時
    - ステータス（未開催/進行中/終了）
  - 進行中セッションの強調表示
  - 未開催セッションのグレーアウト

#### 2.2.3 データ取得
- **API エンドポイント**
  - シーズン一覧: `/sessions` から年の一覧を抽出
  - グランプリ一覧: `/meetings?year={year}`
  - セッション一覧: `/sessions?meeting_key={meeting_key}`

#### 2.2.4 状態管理
```typescript
interface SessionSelection {
  year: number;
  meetingKey: number | null;
  sessionKey: number | null;
}
```

#### 2.2.5 URL同期
- 選択状態をURLクエリパラメータに反映
- 例: `/race?year=2024&meeting=1234&session=5678`
- ブラウザの戻る/進むボタンに対応

---

## 3. ドライバー/チームフィルタリング機能

### 3.1 目的
特定のドライバーやチームに絞ってデータを表示・比較する機能を提供する。すべてのフィルタリング状態はURLパラメータで管理し、共有可能な状態を実現する。

### 3.2 機能要件

#### 3.2.1 フィルタリング方式
- **複数選択可能**
  - チェックボックス形式
  - 最大選択数: 制限なし（推奨は5名まで）
  - URLパラメータで状態管理

- **クイック選択**
  - 「全選択」「全解除」ボタン
  - チーム単位での一括選択
  - お気に入りドライバーの一括選択

#### 3.2.2 URLパラメータ設計

##### ドライバーフィルタ
```
# 単一ドライバー選択
?drivers=1

# 複数ドライバー選択（カンマ区切り）
?drivers=1,44,16

# チーム選択（チーム名）
?teams=Red Bull Racing,Mercedes

# お気に入りのみ表示
?favorites=true

# 組み合わせ例
?year=2024&meeting=1234&session=5678&drivers=1,44&teams=Ferrari
```

##### パラメータ仕様
| パラメータ | 型 | 説明 | 例 |
|-----------|-----|------|-----|
| `drivers` | string | ドライバー番号（カンマ区切り） | `1,44,16` |
| `teams` | string | チーム名（カンマ区切り、URLエンコード） | `Red%20Bull%20Racing,Ferrari` |
| `favorites` | boolean | お気に入りのみ表示 | `true` または省略 |

#### 3.2.3 UI要件
- **ドライバー一覧表示**
  - 表示項目:
    - ドライバー番号
    - ドライバー名（姓名）
    - チーム名
    - チームカラー
    - ドライバー写真（オプション）
  - グルーピング: チーム別
  - ソート: ドライバー番号順（デフォルト）

- **視覚的フィードバック**
  - 選択されたドライバーをチームカラーで強調
  - グラフ内の線・バーもチームカラーで統一
  - 未選択ドライバーは薄いグレーで表示
  - URLパラメータの変更時に自動的に表示を更新

#### 3.2.4 お気に入り機能
- **お気に入り登録**
  - ドライバー単位でお気に入り登録
  - 星アイコンなどでマーク
  - LocalStorageに保存（URLパラメータとは別管理）

- **お気に入り表示**
  - お気に入りドライバーを一覧の上位に表示
  - 「お気に入りのみ表示」トグル（URLパラメータ `favorites=true` に反映）
  - お気に入り状態はローカルストレージで永続化

#### 3.2.5 データ取得
- **API エンドポイント**
  - ドライバー一覧: `/drivers?session_key={session_key}`
  - URLパラメータのフィルタはクライアントサイドで適用

#### 3.2.6 状態管理
```typescript
// URLパラメータから状態を復元
interface DriverFilterParams {
  drivers?: string; // "1,44,16"
  teams?: string;   // "Red Bull Racing,Ferrari"
  favorites?: string; // "true"
}

// アプリケーション内部の状態
interface DriverFilter {
  selectedDriverNumbers: number[]; // URLパラメータから復元
  selectedTeamNames: string[];     // URLパラメータから復元
  showOnlyFavorites: boolean;      // URLパラメータから復元
  favoriteDriverNumbers: number[]; // LocalStorageから復元
}

interface Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  headshot_url: string | null;
}

// URLパラメータとの同期関数
function parseDriverFilter(params: URLSearchParams): DriverFilter {
  const drivers = params.get('drivers');
  const teams = params.get('teams');
  const favorites = params.get('favorites');

  return {
    selectedDriverNumbers: drivers ? drivers.split(',').map(Number) : [],
    selectedTeamNames: teams ? decodeURIComponent(teams).split(',') : [],
    showOnlyFavorites: favorites === 'true',
    favoriteDriverNumbers: getFavoritesFromLocalStorage(),
  };
}

function buildDriverFilterParams(filter: DriverFilter): string {
  const params = new URLSearchParams();

  if (filter.selectedDriverNumbers.length > 0) {
    params.set('drivers', filter.selectedDriverNumbers.join(','));
  }

  if (filter.selectedTeamNames.length > 0) {
    params.set('teams', filter.selectedTeamNames.join(','));
  }

  if (filter.showOnlyFavorites) {
    params.set('favorites', 'true');
  }

  return params.toString();
}
```

#### 3.2.7 フィルタ適用ロジック
```typescript
// ドライバーリストのフィルタリング
function filterDrivers(
  allDrivers: Driver[],
  filter: DriverFilter
): Driver[] {
  let filtered = [...allDrivers];

  // お気に入りフィルタ
  if (filter.showOnlyFavorites) {
    filtered = filtered.filter(d =>
      filter.favoriteDriverNumbers.includes(d.driver_number)
    );
  }

  // チームフィルタ
  if (filter.selectedTeamNames.length > 0) {
    filtered = filtered.filter(d =>
      filter.selectedTeamNames.includes(d.team_name)
    );
  }

  // ドライバーフィルタ
  if (filter.selectedDriverNumbers.length > 0) {
    filtered = filtered.filter(d =>
      filter.selectedDriverNumbers.includes(d.driver_number)
    );
  }

  return filtered;
}
```

#### 3.2.8 URL共有機能
- **共有ボタン**
  - 現在のフィルタ状態を含むURLをコピー
  - 例: `https://app.example.com/race?year=2024&session=5678&drivers=1,44`

- **URL読み込み**
  - ページロード時にURLパラメータを解析
  - フィルタ状態を自動復元
  - ブラウザの戻る/進むボタンに対応（History API使用）

---

## 4. データエクスポート機能

### 4.1 目的
可視化されたグラフや分析データをエクスポートし、外部で利用できるようにする。

### 4.2 機能要件

#### 4.2.1 グラフのエクスポート
- **対応フォーマット**
  - PNG（ラスタ画像）: 推奨解像度 1920x1080
  - SVG（ベクタ画像）: 拡大縮小可能

- **エクスポート内容**
  - グラフ本体
  - 凡例
  - タイトル・ラベル
  - データソース表記（"Data: OpenF1"）

- **実装方法**
  - Canvas API または SVG DOM操作
  - ライブラリ: html2canvas / dom-to-image / chart.jsのネイティブエクスポート

#### 4.2.2 データのエクスポート
- **対応フォーマット**
  - CSV（カンマ区切り）
  - JSON

- **エクスポート内容例（ラップタイムCSV）**
```csv
Driver,Lap,Lap Time,Sector 1,Sector 2,Sector 3,Compound
VER,1,95.234,28.123,35.456,31.655,SOFT
HAM,1,95.678,28.234,35.567,31.877,MEDIUM
...
```

#### 4.2.3 UI要件
- **エクスポートボタン配置**
  - 各グラフ/テーブルの右上にアイコンボタン
  - ホバー時にツールチップ表示（"PNG", "SVG", "CSV"）

- **ダウンロード**
  - ブラウザのダウンロード機能を使用
  - ファイル名: `{data_type}_{circuit}_{session}_{timestamp}.{ext}`
  - 例: `laptimes_bahrain_race_20240302_143022.csv`

#### 4.2.4 状態管理
```typescript
interface ExportOptions {
  format: 'png' | 'svg' | 'csv' | 'json';
  filename: string;
  resolution?: { width: number; height: number }; // PNG用
}
```

---

## 5. レスポンシブデザイン

### 5.1 目的
PC、タブレット、スマートフォンの各デバイスで最適な表示を提供する。

### 5.2 ブレークポイント
```css
/* Mobile First Approach */
mobile: 0px - 767px
tablet: 768px - 1023px
desktop: 1024px以上
```

### 5.3 デバイス別レイアウト

#### 5.3.1 モバイル（0-767px）
- **ナビゲーション**
  - ハンバーガーメニュー
  - ドロワー形式のサイドバー

- **グラフ**
  - 縦長レイアウト
  - 1カラム表示
  - タッチ操作対応（ピンチズーム、スワイプ）

- **フィルタリング**
  - モーダル形式
  - 画面下部からスライドイン

#### 5.3.2 タブレット（768-1023px）
- **グラフ**
  - 2カラム表示（横並び）
  - グリッドレイアウト

- **フィルタリング**
  - サイドバーまたはアコーディオン形式

#### 5.3.3 デスクトップ（1024px以上）
- **レイアウト**
  - 3カラム: サイドバー + メインコンテンツ + 詳細パネル
  - グラフの大画面表示

- **インタラクション**
  - ホバー効果
  - ツールチップ詳細表示

### 5.4 タッチ対応
- **タップ領域**
  - 最小タップサイズ: 44x44px

- **スワイプジェスチャー**
  - 左右スワイプ: セッション切り替え
  - 上下スワイプ: スクロール

- **ピンチズーム**
  - グラフの拡大縮小

### 5.5 パフォーマンス最適化
- **モバイル向け**
  - 画像の遅延読み込み（Lazy Loading）
  - データの段階的読み込み（Pagination）
  - 軽量グラフライブラリの使用

- **共通**
  - コード分割（Code Splitting）
  - Tree Shaking
  - 圧縮（Gzip/Brotli）

---

## 6. エラーハンドリング

### 6.1 エラーの種類

#### 6.1.1 ネットワークエラー
- **発生ケース**
  - API接続失敗
  - タイムアウト
  - レート制限

- **表示方法**
  - トーストメッセージ
  - リトライボタン
  - エラーメッセージ: "データの取得に失敗しました。もう一度お試しください。"

#### 6.1.2 データ不在エラー
- **発生ケース**
  - 選択したセッションにデータが存在しない
  - ドライバーのデータが欠損

- **表示方法**
  - 空状態（Empty State）コンポーネント
  - メッセージ: "このセッションのデータはまだ利用できません。"
  - 代替案の提示（他のセッションへのリンク）

#### 6.1.3 バリデーションエラー
- **発生ケース**
  - 不正な入力値
  - 日付範囲の矛盾

- **表示方法**
  - インラインエラーメッセージ
  - 入力フィールドの赤枠ハイライト

### 6.2 ローディング状態
- **スケルトンスクリーン**
  - グラフ・テーブルの読み込み中
  - コンテンツの形状を模したプレースホルダー

- **スピナー**
  - ボタン押下時
  - データ更新時

### 6.3 フォールバック
- **JavaScript無効時**
  - 基本的なメッセージ表示
  - "このアプリケーションを使用するにはJavaScriptを有効にしてください。"

---

## 7. アクセシビリティ（a11y）

### 7.1 キーボード操作
- **Tab順序**
  - 論理的な順序での移動

- **ショートカットキー**
  - `←/→`: セッション切り替え
  - `Esc`: モーダル・ドロワーを閉じる
  - `/`: 検索フォーカス

### 7.2 スクリーンリーダー対応
- **ARIA属性**
  - `aria-label`: アイコンボタンの説明
  - `aria-labelledby`: セクションの見出し
  - `role`: ランドマーク役割の定義

- **代替テキスト**
  - 画像の`alt`属性
  - グラフのテキスト説明

### 7.3 視覚的配慮
- **カラーコントラスト**
  - WCAG 2.1 AA準拠（4.5:1以上）

- **カラーブラインド対応**
  - 色だけに依存しない情報伝達
  - パターン・形状の併用

### 7.4 フォーカス表示
- **視覚的フィードバック**
  - フォーカスリングの表示
  - `outline`の削除禁止

---

## 8. 国際化（i18n）

### 8.1 対応言語（初期）
- 日本語（ja）
- 英語（en）

### 8.2 翻訳対象
- UI文言
- エラーメッセージ
- ボタンラベル
- ツールチップ

### 8.3 地域対応
- **日付・時刻フォーマット**
  - ユーザーのロケールに基づく表示
  - タイムゾーン変換

- **数値フォーマット**
  - 小数点記号
  - 桁区切り記号

### 8.4 実装方法
```typescript
// i18nライブラリ: react-i18next / next-intl
const translations = {
  ja: {
    'session.practice1': 'フリー走行1',
    'session.qualifying': '予選',
    'session.race': '決勝',
  },
  en: {
    'session.practice1': 'Practice 1',
    'session.qualifying': 'Qualifying',
    'session.race': 'Race',
  }
};
```

---

## 9. パフォーマンス要件

### 9.1 ページロード時間
- **初回表示**: 3秒以内（3G環境）
- **インタラクション応答**: 100ms以内

### 9.2 データキャッシュ
- **ブラウザキャッシュ**
  - 静的アセット: 1週間
  - APIレスポンス: セッション終了後は24時間、進行中は30秒

- **メモリキャッシュ**
  - React Queryのキャッシュ機能
  - staleTime: 5分

### 9.3 最適化手法
- **コンポーネント最適化**
  - React.memo
  - useMemo / useCallback

- **仮想化**
  - 長いリストの仮想スクロール（react-window）

- **画像最適化**
  - WebP形式
  - レスポンシブ画像（srcset）

---

## 10. セキュリティ

### 10.1 XSS対策
- ユーザー入力のサニタイゼーション
- dangerouslySetInnerHTMLの使用禁止

### 10.2 CSRF対策
- APIがトークンベース認証の場合、適切なトークン管理

### 10.3 HTTPS
- 本番環境では必須
- APIエンドポイントもHTTPS

### 10.4 依存関係の管理
- 定期的な依存関係の更新
- 脆弱性スキャン（npm audit）

---

## 11. 非機能要件まとめ

| 項目 | 要件 |
|------|------|
| ブラウザ対応 | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |
| モバイルOS | iOS 14+, Android 10+ |
| アクセシビリティ | WCAG 2.1 AA準拠 |
| パフォーマンス | Lighthouse Score 90以上 |
| SEO | メタタグ最適化、構造化データ |
