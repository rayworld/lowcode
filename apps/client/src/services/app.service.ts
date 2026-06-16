import api from './api';
import { CreateAppDto, UpdateAppDto } from '@lowcode/shared';

export const appService = {
  findAll: () => api.get('/apps'),
  findById: (id: string) => api.get(`/apps/${id}`),
  create: (data: CreateAppDto) => api.post('/apps', data),
  update: (id: string, data: UpdateAppDto) => api.put(`/apps/${id}`, data),
  remove: (id: string) => api.delete(`/apps/${id}`),
};
