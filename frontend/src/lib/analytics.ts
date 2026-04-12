/**
 * GA4 イベントトラッキングユーティリティ
 *
 * GTM dataLayer 経由で GA4 カスタムイベントを送信する。
 * GTM コンテナ (GTM-NBVGPL4V) は index.html で読み込み済み。
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** dataLayer に push するイベントペイロード */
interface DataLayerEvent {
  event: string;
  [key: string]: unknown;
}

/** window.dataLayer の型拡張 */
declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
  }
}

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

/**
 * dataLayer にイベントを push する低レベル関数。
 * GTM が未ロードの場合は何もしない（SSR / テスト環境対策）。
 */
function pushEvent(event: DataLayerEvent): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}

// ---------------------------------------------------------------------------
// Page / Navigation
// ---------------------------------------------------------------------------

/** ページビュー（SPA 遷移時に呼ぶ） */
export function trackPageView(path: string, title?: string): void {
  pushEvent({
    event: 'page_view',
    page_path: path,
    page_title: title,
  });
}

// ---------------------------------------------------------------------------
// Session & Race
// ---------------------------------------------------------------------------

/** セッション（レース / 予選 / FP）閲覧 */
export function trackSessionView(params: {
  year: number;
  grandPrix: string;
  sessionType: string;
}): void {
  pushEvent({
    event: 'session_view',
    ...params,
  });
}

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

/** ドライバー選択 */
export function trackDriverSelect(params: {
  driverCode: string;
  context: string;
}): void {
  pushEvent({
    event: 'driver_select',
    ...params,
  });
}

// ---------------------------------------------------------------------------
// Chart
// ---------------------------------------------------------------------------

/** チャート操作（ズーム、フィルター切替など） */
export function trackChartInteraction(params: {
  chartType: string;
  action: string;
  label?: string;
}): void {
  pushEvent({
    event: 'chart_interaction',
    ...params,
  });
}

// ---------------------------------------------------------------------------
// Share
// ---------------------------------------------------------------------------

/** 共有ボタンクリック */
export function trackShare(params: {
  method: 'clipboard' | 'twitter' | 'line' | 'native';
  contentType: string;
  contentId?: string;
}): void {
  pushEvent({
    event: 'share',
    ...params,
  });
}

// ---------------------------------------------------------------------------
// UTM
// ---------------------------------------------------------------------------

/** UTM パラメータを dataLayer に記録（ランディング時に 1 回呼ぶ） */
export function trackUtmParams(): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    const value = params.get(key);
    if (value) utm[key] = value;
  }
  if (Object.keys(utm).length > 0) {
    pushEvent({ event: 'utm_landing', ...utm });
  }
}
