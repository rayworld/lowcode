import api from './api';

export const entityService = {
  findAll: (appId: string) => api.get(`/apps/${appId}/entities`),
  findById: (appId: string, id: string) => api.get(`/apps/${appId}/entities/${id}`),
  create: (appId: string, data: any) => api.post(`/apps/${appId}/entities`, data),
  update: (appId: string, id: string, data: any) => api.put(`/apps/${appId}/entities/${id}`, data),
  remove: (appId: string, id: string) => api.delete(`/apps/${appId}/entities/${id}`),

  getRelationGraph: (appId: string) => api.get(`/apps/${appId}/entities/relations`),

  addField: (entityId: string, data: any) => api.post(`/entities/${entityId}/fields`, data),
  updateField: (fieldId: string, data: any) => api.put(`/fields/${fieldId}`, data),
  removeField: (fieldId: string) => api.delete(`/fields/${fieldId}`),

  getRecords: (entityId: string, page = 1, pageSize = 20) =>
    api.get(`/entities/${entityId}/data`, { params: { page, pageSize } }),
  createRecord: (entityId: string, data: any) => api.post(`/entities/${entityId}/data`, data),
  updateRecord: (entityId: string, id: string, data: any) =>
    api.put(`/entities/${entityId}/data/${id}`, data),
  deleteRecord: (entityId: string, id: string) =>
    api.delete(`/entities/${entityId}/data/${id}`),
};
