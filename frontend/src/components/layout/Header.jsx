import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, Database, ExternalLink, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../common/NotificationBell';
import ThemeToggle from '../common/ThemeToggle';
import ConnectionIndicator from '../common/ConnectionIndicator';

export function Header({ onMenuClick, healthStatus }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Breadcrumb generator
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentSection = pathParts[0] || 'dashboard';

  const getSectionTitle = (section) => {
    switch (section) {
      case 'dashboard':    return 'Dashboard';
      case 'tasks':        return 'Tasks';
      case 'kanban':       return 'Kanban';
      case 'users':        return 'Users';
      case 'integrations': return 'Integrations';
      default:             return section.charAt(0).toUpperCase() + section.slice(1);
    }
  };

  const avatarText = user
    ? (() => {
        const parts = (user.name || '').trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return (user.name || '??').slice(0, 2).toUpperCase();
      })()
    : '??';

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
  };

  return (
    <header className="h-14 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex items-center gap-3 px-4 z-30">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumb */}
      <div className="flex-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 min-w-0">
        <span className="hidden sm:inline text-slate-400 dark:text-slate-500">WorkPulse</span>
        <span className="hidden sm:inline text-slate-300 dark:text-slate-600">/</span>
        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">{getSectionTitle(currentSection)}</span>
        {pathParts[1] && (
          <>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-500 dark:text-slate-400 font-medium truncate">#{pathParts[1]}</span>
          </>
        )}
      </div>

      {/* API health pill */}
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px]">
        <span className={`w-1.5 h-1.5 rounded-full ${
          healthStatus?.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
        }`} />
        <span>{healthStatus?.status === 'healthy' ? 'API Online' : 'API Connecting...'}</span>
      </div>

      {/* Swagger docs */}
      <a
        href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ?? 'http://localhost:8000'}/docs`}
        target="_blank"
        rel="noreferrer"
        className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
        title="Open Swagger OpenAPI Documentation"
      >
        <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <span>Docs</span>
        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
      </a>

      {/* Real-time Connection Indicator */}
      <ConnectionIndicator />

      {/* Theme Toggle Button */}
      <ThemeToggle id="header-theme-toggle" />

      {/* Notifications */}
      <NotificationBell />

      {/* User profile dropdown */}
      <div className="relative pl-2 border-l border-slate-200 dark:border-slate-700" ref={profileRef}>
        <button
          id="profile-menu-btn"
          onClick={() => setProfileOpen((o) => !o)}
          className="flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg px-2 py-1 transition-colors group"
          aria-haspopup="true"
          aria-expanded={profileOpen}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs shadow-sm shrink-0">
            {avatarText}
          </div>
          <div className="hidden lg:block text-left">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">{user?.name ?? '…'}</p>
              {user?.app_role && (
                <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase border ${
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
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight truncate max-w-[120px]">{user?.role ?? ''}</p>
          </div>
          <ChevronDown className={`hidden lg:block w-3.5 h-3.5 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown menu */}
        {profileOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg shadow-slate-200/50 dark:shadow-black/50 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
            {/* User info */}
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 mb-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{user?.name}</p>
                {user?.app_role && (
                  <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase border ${
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
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{user?.department} · {user?.role}</p>
            </div>

            <Link
              to="/users"
              onClick={() => setProfileOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              Team Directory
            </Link>

            <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
              <button
                id="logout-btn"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
