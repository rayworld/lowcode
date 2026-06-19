import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Token 刷新状态 ──
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  for (const { resolve, reject } of failedQueue) {
    if (error) reject(error);
    else resolve(token!);
  }
  failedQueue = [];
}

// ── Request interceptor：注入 token ──
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const store = useAuthStore.getState();
    const token = store?.accessToken || localStorage.getItem('accessToken');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor 1：拆包 TransformInterceptor 格式 ──
// 服务端 TransformInterceptor 将成功响应包装为 { code, message, data, timestamp }
// 这里统一拆包，使下游代码对 interceptor 的存在透明
api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'code' in response.data && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
);

// ── Response interceptor 2：401 时尝试刷新 token ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // 非 401 或已经重试过
    if (status !== 401 || originalRequest._retry) {
      return handleNonAuthError(error, status);
    }

    // 如果已经是登录页，不要重复跳转
    if (window.location.pathname === '/login') {
      return Promise.reject(error);
    }

    // 如果是登录/刷新接口本身失败了，直接登出
    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
      forceLogout();
      return Promise.reject(error);
    }

    // 尝试刷新 token
    if (!isRefreshing) {
      isRefreshing = true;
      originalRequest._retry = true;

      try {
        const currentRefreshToken = localStorage.getItem('refreshToken');
        if (!currentRefreshToken) throw new Error('No refresh token');

        const { data } = await axios.post('/api/auth/refresh', { refreshToken: currentRefreshToken });

        // 兼容 TransformInterceptor 格式和裸格式
        const tokens = data?.data || data;
        const newToken = tokens?.accessToken;
        const newRefreshToken = tokens?.refreshToken;

        if (!newToken) throw new Error('Refresh response missing token');

        // 更新 localStorage
        localStorage.setItem('accessToken', newToken);
        if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

        // 更新 zustand store
        const store = useAuthStore.getState();
        if (store?.user) {
          store.setAuth(store.user as any, newToken, newRefreshToken || currentRefreshToken);
        }

        processQueue(null, newToken);

        // 重试原始请求
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        forceLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 正在刷新中，将请求排队
    return new Promise((resolve, reject) => {
      failedQueue.push({
        resolve: (token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        },
        reject,
      });
    });
  },
);

// ── 非 401 错误 —— 不弹全局消息，由调用方处理 ──
function handleNonAuthError(error: any, _status: number) {
  return Promise.reject(error);
}

// ── 强制登出（不清除 store 里 persist 的数据之前先清 localStorage） ──
function forceLogout() {
  const store = useAuthStore.getState();
  store?.logout();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

export default api;
