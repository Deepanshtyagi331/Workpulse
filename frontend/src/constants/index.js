/**
 * WorkPulse System Constants
 */

// CURRENT_USER_ID and CURRENT_USER have been removed.
// User identity is now provided by AuthContext (real JWT authentication).
// Use the useAuth() hook to access the current user in components.

// Task Status Mappings & Visual Styling
export const TASK_STATUS = {
  PENDING: {
    key: 'pending',
    label: 'Pending',
    tone: 'amber',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dotClass: 'bg-amber-500',
  },
  IN_PROGRESS: {
    key: 'in_progress',
    label: 'In Progress',
    tone: 'blue',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dotClass: 'bg-blue-500',
  },
  COMPLETED: {
    key: 'completed',
    label: 'Completed',
    tone: 'emerald',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotClass: 'bg-emerald-500',
  },
  BLOCKED: {
    key: 'blocked',
    label: 'Blocked',
    tone: 'rose',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dotClass: 'bg-rose-500',
  },
};

// Task Priority Mappings & Visual Styling
export const TASK_PRIORITY = {
  LOW: {
    key: 'low',
    label: 'Low',
    tone: 'slate',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  },
  MEDIUM: {
    key: 'medium',
    label: 'Medium',
    tone: 'sky',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/80',
    dotClass: 'bg-sky-500',
  },
  HIGH: {
    key: 'high',
    label: 'High',
    tone: 'amber',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dotClass: 'bg-amber-500',
  },
  URGENT: {
    key: 'urgent',
    label: 'Urgent',
    tone: 'rose',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dotClass: 'bg-rose-500',
  },
};

// Navigation Model for Sidebar and Routing
export const NAVIGATION_ITEMS = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    description: 'Executive overview & system health',
  },
  {
    name: 'Tasks',
    path: '/tasks',
    icon: 'CheckSquare',
    description: 'Workflow management & queue',
  },
  {
    name: 'Users',
    path: '/users',
    icon: 'Users',
    description: 'Team directory & access roles',
  },
  {
    name: 'Integrations',
    path: '/integrations',
    icon: 'Plug',
    description: 'External API connectors & sync',
  },
];
