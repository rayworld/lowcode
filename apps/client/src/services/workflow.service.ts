import api from './api';
import { CreateWorkflowDto, UpdateWorkflowDto } from '@lowcode/shared';

export const workflowService = {
  findByApp: (appId: string) => api.get(`/apps/${appId}/workflows`),
  findById: (id: string) => api.get(`/workflows/${id}`),
  create: (data: CreateWorkflowDto) => api.post(`/apps/${data.appId}/workflows`, data),
  update: (id: string, data: UpdateWorkflowDto) => api.put(`/workflows/${id}`, data),
  toggle: (id: string) => api.post(`/workflows/${id}/toggle`),
  execute: (id: string, input?: any) => api.post(`/workflows/${id}/execute`, { input }),
  getLogs: (id: string, page = 1, pageSize = 20) =>
    api.get(`/workflows/${id}/logs`, { params: { page, pageSize } }),
  remove: (id: string) => api.delete(`/workflows/${id}`),
};
