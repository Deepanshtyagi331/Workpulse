import apiClient from './apiClient';

export const integrationService = {
  getExternalTasks(limit = 10) {
    return apiClient.get('/integrations/external-tasks', { params: { limit } });
  },

  getExternalTask(id) {
    return apiClient.get(`/integrations/external-tasks/${id}`);
  },

  // Backward-compatible legacy feed
  getSampleFeed(limit = 5) {
    return apiClient.get('/integrations/sample-feed', { params: { limit } });
  },
};

export default integrationService;
