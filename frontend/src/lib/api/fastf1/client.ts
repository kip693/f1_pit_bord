import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import type { ApiError } from '../types';

// FastF1 Backend URL (Cloud Run or local)
const FASTF1_BASE_URL = import.meta.env.VITE_FASTF1_API_URL || 'http://localhost:8080';
const ENABLE_LOGS = import.meta.env.VITE_ENABLE_API_LOGS === 'true';

// Axios instance for FastF1 backend
export const fastf1Client: AxiosInstance = axios.create({
    baseURL: FASTF1_BASE_URL,
    timeout: 60000, // 60 seconds (FastF1 can be slow on first load)
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
fastf1Client.interceptors.request.use(
    (config) => {
        if (ENABLE_LOGS) {
            console.log(
                `[FastF1 Request] ${config.method?.toUpperCase()} ${config.url}`,
                config.params,
            );
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// Response interceptor
fastf1Client.interceptors.response.use(
    (response) => {
        if (ENABLE_LOGS) {
            console.log(`[FastF1 Response] ${response.config.url}`, response.data);
        }
        return response;
    },
    (error: AxiosError) => {
        const apiError: ApiError = {
            message: error.message || 'Unknown error occurred',
            status: error.response?.status || 500,
            endpoint: error.config?.url || 'unknown',
            timestamp: new Date().toISOString(),
        };

        console.error('[FastF1 API Error]', apiError);

        // User-friendly error messages
        if (error.code === 'ECONNABORTED') {
            apiError.message = 'リクエストがタイムアウトしました（FastF1データ処理中）';
        } else if (error.response?.status === 404) {
            apiError.message = 'データが見つかりません';
        } else if (error.response?.status === 500) {
            apiError.message = 'バックエンドサーバーエラーが発生しました';
        } else if (error.response?.status === 503) {
            apiError.message = 'サービスが一時的に利用できません';
        }

        return Promise.reject(apiError);
    },
);

// Generic GET request
export async function getFastF1<T>(
    endpoint: string,
    params?: Record<string, any>,
    config?: AxiosRequestConfig,
): Promise<T> {
    const response = await fastf1Client.get<T>(endpoint, { params, ...config });
    return response.data;
}

// Generic POST request
export async function postFastF1<T>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig,
): Promise<T> {
    const response = await fastf1Client.post<T>(endpoint, data, config);
    return response.data;
}
