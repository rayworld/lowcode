import api from './api';
import { CreatePageDto, UpdatePageDto } from '@lowcode/shared';

export const pageService = {
  findByApp: (appId: string) => api.get(`/apps/${appId}/pages`),
  findById: (id: string) => api.get(`/pages/${id}`),
  create: (data: CreatePageDto) => api.post(`/apps/${data.appId}/pages`, data),
  update: (id: string, data: UpdatePageDto) => api.put(`/pages/${id}`, data),
  publish: (id: string) => api.post(`/pages/${id}/publish`),
  remove: (id: string) => api.delete(`/pages/${id}`),
};
