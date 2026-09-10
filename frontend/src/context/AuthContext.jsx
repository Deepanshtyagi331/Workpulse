import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

// ---------------------------------------------------------------------------
// Context shape (also serves as documentation of available values)
// ---------------------------------------------------------------------------
const AuthContext = createContext({
  user: null,          // Current authenticated user or null
  isAuthenticated: false,
  isLoading: true,     // True while the initial /auth/me check is in flight
  appRole: null,       // 'admin' | 'manager' | 'employee' | null
  isAdmin: false,
  isManager: false,
  isEmployee: false,
  hasRole: () => false,
  hasAnyRole: () => false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

// ---------------------------------------------------------------------------
// AuthProvider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // -------------------------------------------------------------------------
  // Bootstrap: check stored token on mount
  // -------------------------------------------------------------------------
  const bootstrapped = useRef(false);

  const loadCurrentUser = useCallback(async () => {
    const token = authService.getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const profile = await authService.getMe();
      setUser(profile);
    } catch {
      // Token invalid or expired — discard it
      authService.clearToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    loadCurrentUser();
  }, [loadCurrentUser]);

  // -------------------------------------------------------------------------
  // Global 401 listener (fired by apiClient when any request returns 401)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      navigate('/login', { replace: true });
    };
    window.addEventListener('workpulse:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('workpulse:unauthorized', handleUnauthorized);
  }, [navigate]);

  // -------------------------------------------------------------------------
  // Auth actions
  // -------------------------------------------------------------------------
  const login = useCallback(async ({ email, password }) => {
    const res = await authService.login({ email, password });
    authService.setToken(res.access_token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async ({ name, email, password, department, role }) => {
    const res = await authService.register({ name, email, password, department, role });
    authService.setToken(res.access_token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    // Best-effort server notify; always clear locally
    await authService.logout().catch(() => {});
    authService.clearToken();
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await authService.getMe();
      setUser(profile);
      return profile;
    } catch {
      logout();
    }
  }, [logout]);

  // -------------------------------------------------------------------------
  // RBAC helpers
  // -------------------------------------------------------------------------
  const appRole = user?.app_role || null;
  const isAdmin = appRole === 'admin';
  const isManager = appRole === 'manager';
  const isEmployee = appRole === 'employee';

  const hasRoleCheck = useCallback(
    (role) => appRole === role,
    [appRole]
  );

  const hasAnyRoleCheck = useCallback(
    (roles = []) => roles.includes(appRole),
    [appRole]
  );

  // -------------------------------------------------------------------------
  // Context value (memoised to avoid unnecessary child re-renders)
  // -------------------------------------------------------------------------
  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      appRole,
      isAdmin,
      isManager,
      isEmployee,
      hasRole: hasRoleCheck,
      hasAnyRole: hasAnyRoleCheck,
      login,
      register,
      logout,
      refreshUser,
    }),
    [
      user,
      isLoading,
      appRole,
      isAdmin,
      isManager,
      isEmployee,
      hasRoleCheck,
      hasAnyRoleCheck,
      login,
      register,
      logout,
      refreshUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook for consuming auth state
// ---------------------------------------------------------------------------
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export default AuthContext;
