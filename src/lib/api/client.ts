import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import type { ApiError } from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.openf1.org/v1';
const ENABLE_LOGS = import.meta.env.VITE_ENABLE_API_LOGS === 'true';

// Axiosインスタンス作成
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30秒
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター
apiClient.interceptors.request.use(
  (config) => {
    // リクエストログ（開発環境のみ）
    if (ENABLE_LOGS) {
      console.log(
        `[API Request] ${config.method?.toUpperCase()} ${config.url}`,
        config.params,
      );
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// レスポンスインターセプター
apiClient.interceptors.response.use(
  (response) => {
    // レスポンスログ（開発環境のみ）
    if (ENABLE_LOGS) {
      console.log(`[API Response] ${response.config.url}`, response.data);
    }
    return response;
  },
  (error: AxiosError) => {
    // エラーハンドリング
    const apiError: ApiError = {
      message: error.message || 'Unknown error occurred',
      status: error.response?.status || 500,
      endpoint: error.config?.url || 'unknown',
      timestamp: new Date().toISOString(),
    };

    // エラーログ
    console.error('[API Error]', apiError);

    // ユーザー向けエラーメッセージの整形
    if (error.code === 'ECONNABORTED') {
      apiError.message = 'リクエストがタイムアウトしました';
    } else if (error.response?.status === 401) {
      // OpenF1 API specific: Session in progress check
      const detail = (error.response.data as any)?.detail;
      if (typeof detail === 'string' && detail.toLowerCase().includes('progress')) {
        apiError.message = 'セッション進行中のため現在ダッシュボードを表示できません';
      } else {
        apiError.message = '認証エラーが発生しました';
      }
    } else if (error.response?.status === 404) {
      apiError.message = 'データが見つかりません';
    } else if (error.response?.status === 429) {
      apiError.message = 'リクエスト制限に達しました。しばらくお待ちください';
    } else if (error.response?.status && error.response.status >= 500) {
      apiError.message = 'サーバーエラーが発生しました';
    }

    return Promise.reject(apiError);
  },
);

// 汎用GETリクエスト
export async function get<T>(
  endpoint: string,
  params?: Record<string, any>,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.get<T>(endpoint, { params, ...config });
  return response.data;
}

// 汎用POSTリクエスト（将来の拡張用）
export async function post<T>(
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.post<T>(endpoint, data, config);
  return response.data;
}
