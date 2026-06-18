import api from './api';

/** Download a file from the server */
function downloadBlob(data: Blob, filename: string) {
  const url = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export const exportService = {
  /** Export entity data as CSV */
  async exportCsv(entityId: string, entityName: string) {
    const response = await api.get(`/entities/${entityId}/data/export/csv`, {
      responseType: 'blob',
    });
    const filename = `${entityName}_数据导出.csv`;
    downloadBlob(response.data, filename);
  },
};
