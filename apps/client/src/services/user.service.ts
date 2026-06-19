import api from './api';
import { User, UpdateUserDto } from '@lowcode/shared';

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const userService = {
  findAll: (page = 1, pageSize = 20) =>
    api.get<PaginatedResponse<User>>('/users', { params: { page, pageSize } }),

  findById: (id: string) => api.get<User>(`/users/${id}`),

  update: (id: string, dto: UpdateUserDto) =>
    api.put<User>(`/users/${id}`, dto),

  remove: (id: string) => api.delete(`/users/${id}`),
};
