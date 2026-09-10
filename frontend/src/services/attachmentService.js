import apiClient from './apiClient';
import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const attachmentService = {
  getAttachments(taskId, params = {}) {
    return apiClient.get(`/tasks/${taskId}/attachments`, { params });
  },

  upload(taskId, file) {
    const data = new FormData();
    data.append('file', file);
    return apiClient.post(`/tasks/${taskId}/attachments`, data, {
      timeout: 60000,
    });
  },

  delete(attachmentId) {
    return apiClient.delete(`/attachments/${attachmentId}`);
  },

  async download(attachmentId, originalFilename) {
    const token = authService.getToken();
    const response = await fetch(`${API_BASE_URL}/attachments/${attachmentId}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      let message = 'Could not download the file.';
      try {
        const body = await response.json();
        if (body?.detail) message = typeof body.detail === 'string' ? body.detail : message;
      } catch {
        /* ignore */
      }
      const err = new Error(message);
      err.status = response.status;
      throw err;
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = originalFilename || 'download';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default attachmentService;
