/**
 * フォーマット用ユーティリティ関数
 */

/**
 * 秒をMM:SS.fff形式にフォーマット
 */
export function formatLapTime(seconds: number | null): string {
  if (seconds === null) return '--:--.---';

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toFixed(3).padStart(6, '0')}`;
}

/**
 * 秒をSS.fff形式にフォーマット
 */
export function formatSectorTime(seconds: number | null): string {
  if (seconds === null) return '--.---';
  return seconds.toFixed(3);
}

/**
 * 速度をフォーマット（km/h）
 */
export function formatSpeed(speed: number | null): string {
  if (speed === null) return '---';
  return `${Math.round(speed)} km/h`;
}

/**
 * 日付をフォーマット
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 日時をフォーマット
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * タイヤコンパウンドの色を取得
 */
export function getTyreColor(compound: string): string {
  const colors: Record<string, string> = {
    SOFT: '#FF0000',
    MEDIUM: '#FFFF00',
    HARD: '#FFFFFF',
    INTERMEDIATE: '#00FF00',
    WET: '#0000FF',
  };
  return colors[compound] || '#CCCCCC';
}

/**
 * タイヤコンパウンドの略称を取得
 */
export function getTyreAbbreviation(compound: string): string {
  const abbr: Record<string, string> = {
    SOFT: 'S',
    MEDIUM: 'M',
    HARD: 'H',
    INTERMEDIATE: 'I',
    WET: 'W',
  };
  return abbr[compound] || compound[0];
}

/**
 * 順位をフォーマット（P1, P2, ...）
 */
export function formatPosition(position: number): string {
  return `P${position}`;
}

/**
 * デルタタイム（差分）をフォーマット
 */
export function formatDelta(delta: number | null): string {
  if (delta === null) return '---';
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(3)}`;
}
