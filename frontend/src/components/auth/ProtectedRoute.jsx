import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * ProtectedRoute — wraps routes that require authentication.
 *
 * While the initial auth check is in flight (isLoading=true), renders a
 * full-screen spinner. If the user is unauthenticated, redirects to /login
 * preserving the intended destination so after login they land back here.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

/**
 * PublicRoute — wraps pages that should NOT be shown to authenticated users.
 * Authenticated users are redirected to /dashboard.
 */
export function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/**
 * RoleProtectedRoute — wraps routes that require specific application roles (RBAC).
 *
 * Checks if the user is authenticated and possesses one of the allowed roles.
 * If not authorized, renders the AccessDenied view.
 */
export function RoleProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && (!user?.app_role || !allowedRoles.includes(user.app_role))) {
    // Dynamic import avoided, import AccessDenied directly or render it
    const AccessDenied = React.lazy(() => import('../common/AccessDenied'));
    return (
      <React.Suspense fallback={<LoadingSpinner size="lg" />}>
        <AccessDenied requiredRoles={allowedRoles} />
      </React.Suspense>
    );
  }

  return children;
}

export default ProtectedRoute;
