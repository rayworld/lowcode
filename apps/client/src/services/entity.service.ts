import api from './api';

export const entityService = {
  findAll: (appId: string) => api.get(`/apps/${appId}/entities`),
  findById: (id: string) => api.get(`/apps/${id}/entities/${id}`),
  create: (appId: string, data: any) => api.post(`/apps/${appId}/entities`, data),
  update: (id: string, data: any) => api.put(`/apps/${id}/entities`, data),
  remove: (id: string) => api.delete(`/apps/${id}/entities`),

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
