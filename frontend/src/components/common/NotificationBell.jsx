import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  UserCheck,
  Activity,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Clock,
} from 'lucide-react';
import notificationService from '../../services/notificationService';
import { formatRelativeTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

export function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await notificationService.getNotifications(user.id);
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Initial load and periodic poll
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Click outside and Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen((prev) => !prev);
  };

  const handleItemClick = (notification) => {
    notificationService.markAsRead(notification.id, user?.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setIsOpen(false);

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllAsRead = (e) => {
    e.stopPropagation();
    const allIds = notifications.map((n) => n.id);
    notificationService.markAllAsRead(allIds, user?.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    const allIds = notifications.map((n) => n.id);
    notificationService.clearAll(allIds, user?.id);
    setNotifications([]);
    setUnreadCount(0);
  };

  // Icon renderer for notification category
  const renderCategoryIcon = (category) => {
    switch (category) {
      case 'overdue':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
            <AlertTriangle className="h-4 w-4 stroke-[2.2]" />
          </div>
        );
      case 'assigned':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 shrink-0">
            <UserCheck className="h-4 w-4 stroke-[2.2]" />
          </div>
        );
      case 'activity':
      default:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-200 shrink-0">
            <Activity className="h-4 w-4 stroke-[2.2]" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`relative rounded-lg p-2 transition-colors ${
          isOpen
            ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Notifications"
      >
        <Bell className="h-5 w-5" />

        {/* Dynamic Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 sm:right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/60 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 mb-2.5">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">All caught up!</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  No active notifications or alerts requiring your attention.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                    !item.isRead ? 'bg-indigo-50/20 dark:bg-indigo-950/30' : 'bg-white dark:bg-slate-800'
                  }`}
                >
                  {renderCategoryIcon(item.category)}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          item.category === 'overdue'
                            ? 'text-rose-600 dark:text-rose-400'
                            : item.category === 'assigned'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-purple-600 dark:text-purple-400'
                        }`}
                      >
                        {item.categoryLabel}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    </div>

                    <h4
                      className={`text-xs font-semibold leading-snug line-clamp-1 ${
                        !item.isRead ? 'text-slate-900 dark:text-slate-100 font-bold' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!item.isRead && (
                    <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 self-center" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer link to task queue */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/tasks');
                }}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors inline-flex items-center gap-1"
              >
                <span>View all tasks</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
