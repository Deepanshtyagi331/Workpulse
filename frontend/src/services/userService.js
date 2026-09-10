import apiClient from './apiClient';

export const userService = {
  getUsers(params = {}) {
    return apiClient.get('/users', { params });
  },

  getUser(id) {
    return apiClient.get(`/users/${id}`);
  },

  // Backward-compatible alias
  getUserById(id) {
    return apiClient.get(`/users/${id}`);
  },

  createUser(data) {
    return apiClient.post('/users', data);
  },

  updateUser(id, data) {
    return apiClient.put(`/users/${id}`, data);
  },

  deleteUser(id) {
    return apiClient.delete(`/users/${id}`);
  },
};

export default userService;
