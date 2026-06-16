import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const msg = error.response?.data?.message || error.message;

    if (status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (status === 403) {
      message.error('权限不足');
    } else if (status === 404) {
      message.error('资源不存在');
    } else if (status >= 500) {
      message.error('服务器错误，请稍后重试');
    } else if (msg) {
      message.error(msg);
    }

    return Promise.reject(error);
  },
);

export default api;
