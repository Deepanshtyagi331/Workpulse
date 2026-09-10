import apiClient from './apiClient';

export const dashboardService = {
  /**
   * Fetches dashboard statistics.
   * The backend derives the current user from the JWT Bearer token in the
   * Authorization header (automatically attached by apiClient).
   * No user_id query parameter is needed or sent.
   */
  getDashboard() {
    return apiClient.get('/dashboard');
  },

  getStats() {
    return apiClient.get('/stats');
  },

  checkHealth() {
    return apiClient.get('/health');
  },
};

export default dashboardService;
