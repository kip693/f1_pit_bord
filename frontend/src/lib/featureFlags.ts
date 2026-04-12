/**
 * Feature Flag 管理ユーティリティ
 *
 * 環境変数 (VITE_FF_*) ベースの軽量 Feature Flag。
 * Vite の import.meta.env から読み取り、ビルド時に Tree-shaken される。
 *
 * 使い方:
 *   VITE_FF_SNS_SHARE=true  → isFeatureEnabled('SNS_SHARE') === true
 *   未設定 or "false"        → isFeatureEnabled('SNS_SHARE') === false
 */

// ---------------------------------------------------------------------------
// Flag 定義
// ---------------------------------------------------------------------------

/** 利用可能な Feature Flag 名 */
export type FeatureFlagName =
  | 'SNS_SHARE'
  | 'DARK_MODE'
  | 'TELEMETRY_CHART'
  | 'RACE_COMPARISON'
  | 'DRIVER_PROFILE'
  | 'LAP_ANIMATION';

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

/**
 * 指定した Feature Flag が有効かどうかを返す。
 *
 * @param name - Flag 名（VITE_FF_ プレフィックスは自動付与）
 * @returns 環境変数が "true" (case-insensitive) のとき true
 */
export function isFeatureEnabled(name: FeatureFlagName): boolean {
  const envKey = `VITE_FF_${name}`;
  const value = import.meta.env[envKey];
  return typeof value === 'string' && value.toLowerCase() === 'true';
}

/**
 * 有効な Feature Flag の一覧を返す（デバッグ用）。
 */
export function getEnabledFeatures(): FeatureFlagName[] {
  const allFlags: FeatureFlagName[] = [
    'SNS_SHARE',
    'DARK_MODE',
    'TELEMETRY_CHART',
    'RACE_COMPARISON',
    'DRIVER_PROFILE',
    'LAP_ANIMATION',
  ];
  return allFlags.filter((flag) => isFeatureEnabled(flag));
}
