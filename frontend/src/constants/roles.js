/**
 * WorkPulse Application Roles (Frontend)
 *
 * Distinguishes the user's application authorization role (admin/manager/employee)
 * from their organizational job title ('Lead Architect', 'Staff Designer', etc.).
 */

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.EMPLOYEE]: 'Employee',
};

export const ROLE_BADGE_COLORS = {
  [ROLES.ADMIN]: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  [ROLES.MANAGER]: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  [ROLES.EMPLOYEE]: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
};

/**
 * Checks if a user has at least one of the specified roles.
 * @param {Object} user - The user object containing app_role.
 * @param {string[]} allowedRoles - Array of allowed role strings.
 * @returns {boolean}
 */
export function hasRole(user, allowedRoles = []) {
  if (!user || !user.app_role) return false;
  return allowedRoles.includes(user.app_role);
}

/**
 * Checks if a user is an admin.
 */
export function isAdmin(user) {
  return user?.app_role === ROLES.ADMIN;
}

/**
 * Checks if a user is a manager or admin.
 */
export function isManagerOrAdmin(user) {
  return user?.app_role === ROLES.ADMIN || user?.app_role === ROLES.MANAGER;
}
