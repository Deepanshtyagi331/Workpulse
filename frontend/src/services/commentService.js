import apiClient from './apiClient';

export const commentService = {
  getComments(taskId, params = {}) {
    return apiClient.get(`/tasks/${taskId}/comments`, { params });
  },

  createComment(taskId, data) {
    return apiClient.post(`/tasks/${taskId}/comments`, data);
  },

  updateComment(id, data) {
    return apiClient.put(`/comments/${id}`, data);
  },

  deleteComment(id) {
    return apiClient.delete(`/comments/${id}`);
  },
};

export default commentService;
