import api from './api';

export const componentService = {
  findAll: (category?: string) => api.get('/components', { params: { category } }),
  findById: (id: string) => api.get(`/components/${id}`),
};
