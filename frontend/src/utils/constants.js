export * from '../constants';

export const APP_NAME = "WorkPulse";
export const APP_TAGLINE = "Internal Task & Management Dashboard";

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", path: "/dashboard" },
  { id: "tasks", label: "Tasks", icon: "CheckSquare", path: "/tasks" },
  { id: "users", label: "Team Members", icon: "Users", path: "/users" },
  { id: "integrations", label: "Integrations", icon: "Plug", path: "/integrations" },
];

export const DEPARTMENT_COLORS = {
  Engineering: "bg-blue-50 text-blue-700 border-blue-200",
  Product: "bg-purple-50 text-purple-700 border-purple-200",
  Design: "bg-pink-50 text-pink-700 border-pink-200",
  Operations: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Quality Assurance": "bg-amber-50 text-amber-700 border-amber-200",
  Security: "bg-red-50 text-red-700 border-red-200",
  Default: "bg-slate-50 text-slate-700 border-slate-200",
};

