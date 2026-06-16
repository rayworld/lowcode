import api from './api';
import { CreatePageDto, UpdatePageDto } from '@lowcode/shared';

export const pageService = {
  findByApp: (appId: string) => api.get(`/apps/${appId}/pages`),
  findById: (appId: string, id: string) => api.get(`/apps/${appId}/pages/${id}`),
  create: (data: CreatePageDto) => api.post(`/apps/${data.appId}/pages`, data),
  update: (appId: string, id: string, data: UpdatePageDto) =>
    api.put(`/apps/${appId}/pages/${id}`, data),
  publish: (appId: string, id: string) =>
    api.post(`/apps/${appId}/pages/${id}/publish`),
  remove: (appId: string, id: string) =>
    api.delete(`/apps/${appId}/pages/${id}`),
};
