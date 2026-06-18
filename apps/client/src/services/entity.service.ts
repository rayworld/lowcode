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

  getRecords: (entityId: string, page = 1, pageSize = 20, options?: { sort?: string; filter?: string; q?: string }) =>
    api.get(`/entities/${entityId}/data`, {
      params: { page, pageSize, ...options },
    }),
  createRecord: (entityId: string, data: any) => api.post(`/entities/${entityId}/data`, data),
  updateRecord: (entityId: string, id: string, data: any) =>
    api.put(`/entities/${entityId}/data/${id}`, data),
  deleteRecord: (entityId: string, id: string) =>
    api.delete(`/entities/${entityId}/data/${id}`),

  // ========== Version Management ==========
  listVersions: (appId: string, entityId: string) =>
    api.get(`/apps/${appId}/entities/${entityId}/versions`),
  getVersion: (appId: string, entityId: string, version: number) =>
    api.get(`/apps/${appId}/entities/${entityId}/versions/${version}`),
  takeSnapshot: (appId: string, entityId: string, comment?: string) =>
    api.post(`/apps/${appId}/entities/${entityId}/versions/snapshot`, { comment }),
  compareVersions: (appId: string, entityId: string, fromVersion: number, toVersion: number) =>
    api.post(`/apps/${appId}/entities/${entityId}/versions/compare`, { fromVersion, toVersion }),
  restoreVersion: (appId: string, entityId: string, version: number) =>
    api.post(`/apps/${appId}/entities/${entityId}/versions/${version}/restore`),

  // ========== Code Generation ==========
  generateCode: (appId: string, entityId: string) =>
    api.get(`/apps/${appId}/codegen/entities/${entityId}`),
  generateAllTypes: (appId: string) =>
    api.get(`/apps/${appId}/codegen/all`),

  // ========== Model Import / Export ==========
  exportModel: (appId: string) =>
    api.get(`/apps/${appId}/entities/export/model`),
  importModel: (appId: string, model: any, conflictStrategy?: 'skip' | 'overwrite' | 'rename') =>
    api.post(`/apps/${appId}/entities/import/model`, { model, conflictStrategy }),

  // ========== Field Reorder ==========
  reorderFields: (appId: string, entityId: string, fieldIds: string[]) =>
    api.put(`/apps/${appId}/entities/${entityId}/fields/reorder`, { fieldIds }),

  // ========== Type Conversion ==========
  getCompatibleTypes: (appId: string, fieldId: string) =>
    api.get(`/apps/${appId}/entities/fields/${fieldId}/compatible-types`),

  // ========== Entity Clone ==========
  cloneEntity: (appId: string, id: string, name?: string) =>
    api.post(`/apps/${appId}/entities/${id}/clone`, { name }),
};
