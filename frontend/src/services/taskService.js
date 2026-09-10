import apiClient from './apiClient';

export const taskService = {
  getTasks(params = {}) {
    const cleanParams = {};

    Object.entries(params).forEach(([key, value]) => {
      // Map assignee_id -> assignee if passed
      const targetKey = key === 'assignee_id' ? 'assignee' : key;
      if (
        value !== '' &&
        value !== null &&
        value !== undefined &&
        value !== 'all' &&
        value !== 'ALL'
      ) {
        cleanParams[targetKey] = value;
      }
    });

    return apiClient.get('/tasks', { params: cleanParams });
  },

  getTask(id) {
    return apiClient.get(`/tasks/${id}`);
  },

  createTask(data) {
    return apiClient.post('/tasks', data);
  },

  updateTask(id, data) {
    return apiClient.put(`/tasks/${id}`, data);
  },

  deleteTask(id) {
    return apiClient.delete(`/tasks/${id}`);
  },
};

export default taskService;
