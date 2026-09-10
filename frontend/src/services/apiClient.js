import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const TOKEN_KEY = 'workpulse_access_token';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
});

// Request interceptor — automatically attach Bearer token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — centralized error extraction & 401 handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // On 401, clear stored token so the next page load redirects to /login
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      // Dispatch a custom event so AuthContext can react without importing apiClient
      window.dispatchEvent(new CustomEvent('workpulse:unauthorized'));
    }

    let message = 'An unexpected network error occurred';

    if (error.response?.data) {
      const { detail, message: errMessage } = error.response.data;
      if (typeof detail === 'string') {
        message = detail;
      } else if (Array.isArray(detail)) {
        // Handle FastAPI validation error list
        message = detail.map((err) => err.msg || JSON.stringify(err)).join(', ');
      } else if (errMessage) {
        message = errMessage;
      }
    } else if (error.code === 'ECONNABORTED') {
      message = 'Request timed out. Please try again.';
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject(new Error(message));
  }
);

export default apiClient;
