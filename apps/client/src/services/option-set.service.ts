import api from './api';

export const optionSetService = {
  findAll: (appId: string) => api.get(`/apps/${appId}/option-sets`),
  findById: (appId: string, id: string) => api.get(`/apps/${appId}/option-sets/${id}`),
  create: (appId: string, data: any) => api.post(`/apps/${appId}/option-sets`, data),
  update: (appId: string, id: string, data: any) => api.put(`/apps/${appId}/option-sets/${id}`, data),
  remove: (appId: string, id: string) => api.delete(`/apps/${appId}/option-sets/${id}`),
};
