import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Plug,
  Activity,
  X,
  User,
} from 'lucide-react';
import { NAVIGATION_ITEMS } from '../../constants';
import { APP_NAME } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

const ICON_MAP = {
  LayoutDashboard,
  CheckSquare,
  Users,
  Plug,
};

export function Sidebar({ mobileOpen = false, setMobileOpen }) {
  const { user } = useAuth();
  const avatarText = user
    ? (() => { const p=(user.name||'').trim().split(' '); return p.length>=2?(p[0][0]+p[p.length-1][0]).toUpperCase():(user.name||'??').slice(0,2).toUpperCase(); })()
    : '??';
  const content = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-slate-200">
      <div>
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
              <Activity className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-none tracking-tight">
                {APP_NAME}
              </h1>
              <span className="text-[11px] font-medium text-slate-500">Internal Operations</span>
            </div>
          </div>
          {setMobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <div className="p-3">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
            {avatarText}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">{user?.name ?? '…'}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 truncate">{user?.role ?? ''}</span>
              <span className="inline-block px-1 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">
                Authenticated
              </span>
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
