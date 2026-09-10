import apiClient from './apiClient';

export const statsService = {
  getDashboardStats() {
    return apiClient.get('/stats/');
  },

  checkHealth() {
    return apiClient.get('/health');
  },
};

export default statsService;
