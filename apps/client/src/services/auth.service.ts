import api from './api';
import { LoginDto, RegisterDto, AuthTokens } from '@lowcode/shared';

export const authService = {
  login: (data: LoginDto) => api.post<AuthTokens>('/auth/login', data),
  register: (data: RegisterDto) => api.post<AuthTokens>('/auth/register', data),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
};
