import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Columns3,
  Users,
  Plug,
  Activity,
  X,
} from 'lucide-react';
import { NAVIGATION_ITEMS } from '../../constants';
import { APP_NAME } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

const ICON_MAP = {
  LayoutDashboard,
  CheckSquare,
  Columns3,
  Users,
  Plug,
};

export function Sidebar({ mobileOpen = false, setMobileOpen }) {
  const { user } = useAuth();
  const avatarText = user
    ? (() => { const p=(user.name||'').trim().split(' '); return p.length>=2?(p[0][0]+p[p.length-1][0]).toUpperCase():(user.name||'??').slice(0,2).toUpperCase(); })()
    : '??';
  const content = (
    <div className="flex h-full flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div>
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none">
              <Activity className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-none tracking-tight">
                {APP_NAME}
              </h1>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Internal Operations</span>
            </div>
          </div>
          {setMobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <div className="p-3">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navigation
          </div>
          <nav className="space-y-1">
            {NAVIGATION_ITEMS.map((item) => {
              const Icon = ICON_MAP[item.icon] || Activity;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen && setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Context & Environment Card in Sidebar Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
            {avatarText}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.name ?? '…'}</p>
              {user?.app_role && (
                <span className={`px-1 py-0.2 text-[8px] font-bold rounded uppercase border shrink-0 ${
                  user.app_role === 'admin'
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50'
                    : user.app_role === 'manager'
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'
                    : 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/50'
                }`}>
                  {user.app_role}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.role ?? ''}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 shadow-sm">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="relative z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
