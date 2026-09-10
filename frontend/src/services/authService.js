import apiClient from './apiClient';

const TOKEN_KEY = 'workpulse_access_token';

export const authService = {
  /** Retrieve the stored JWT from localStorage. */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  /** Persist the JWT in localStorage. */
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  /** Remove the JWT from localStorage (logout). */
  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  /** Returns true when a token is stored (does not validate expiry here). */
  isAuthenticated() {
    return Boolean(this.getToken());
  },

  /**
   * Register a new account.
   * @returns {Promise<{access_token, token_type, user}>}
   */
  register({ name, email, password, department, role }) {
    return apiClient.post('/auth/register', { name, email, password, department, role });
  },

  /**
   * Login with email + password.
   * @returns {Promise<{access_token, token_type, user}>}
   */
  login({ email, password }) {
    return apiClient.post('/auth/login', { email, password });
  },

  /**
   * Fetch the currently authenticated user's profile.
   * @returns {Promise<CurrentUserResponse>}
   */
  getMe() {
    return apiClient.get('/auth/me');
  },

  /**
   * Server-side logout stub (token is discarded on client only).
   */
  logout() {
    return apiClient.post('/auth/logout', {}).catch(() => {
      // Ignore network errors during logout — always clear local state
    });
  },
};

export default authService;
