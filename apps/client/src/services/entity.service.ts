import api from './api';

export const entityService = {
  findAll: (appId: string) => api.get(`/apps/${appId}/entities`),
  findById: (appId: string, id: string) => api.get(`/apps/${appId}/entities/${id}`),
  create: (appId: string, data: any) => api.post(`/apps/${appId}/entities`, data),
  update: (appId: string, id: string, data: any) => api.put(`/apps/${appId}/entities/${id}`, data),
  remove: (appId: string, id: string) => api.delete(`/apps/${appId}/entities/${id}`),

  getRelationGraph: (appId: string) => api.get(`/apps/${appId}/entities/relations`),

  addField: (appId: string, entityId: string, data: any) =>
    api.post(`/apps/${appId}/entities/${entityId}/fields`, data),
  updateField: (appId: string, fieldId: string, data: any) =>
    api.put(`/apps/${appId}/entities/fields/${fieldId}`, data),
  removeField: (appId: string, fieldId: string) =>
    api.delete(`/apps/${appId}/entities/fields/${fieldId}`),

  getRecords: (entityId: string, page = 1, pageSize = 20) =>
    api.get(`/entities/${entityId}/data`, { params: { page, pageSize } }),
  createRecord: (entityId: string, data: any) => api.post(`/entities/${entityId}/data`, data),
  updateRecord: (entityId: string, id: string, data: any) =>
    api.put(`/entities/${entityId}/data/${id}`, data),
  deleteRecord: (entityId: string, id: string) =>
    api.delete(`/entities/${entityId}/data/${id}`),
};
