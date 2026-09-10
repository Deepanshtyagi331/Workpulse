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

  getHistory(taskId, params = {}) {
    return apiClient.get(`/tasks/${taskId}/history`, { params });
  },

  /**
   * Loads every matching task across pages (Kanban has no pagination UI).
   * Reuses getTasks so filters/search stay consistent with the Tasks table.
   */
  async getAllTasks(params = {}) {
    const limit = 100;
    const first = await this.getTasks({ ...params, page: 1, limit });
    const items = [...(first.items || [])];
    const totalPages = first.total_pages || 1;

    for (let page = 2; page <= totalPages; page += 1) {
      const res = await this.getTasks({ ...params, page, limit });
      items.push(...(res.items || []));
    }

    return items;
  },
};

export default taskService;
