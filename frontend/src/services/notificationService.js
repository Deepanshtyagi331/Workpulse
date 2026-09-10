import taskService from './taskService';
import { formatRelativeTime } from '../utils/formatters';

const STORAGE_READ_KEY = (userId) => `workpulse_read_notifications_${userId}`;
const STORAGE_CLEARED_KEY = (userId) => `workpulse_cleared_notifications_${userId}`;

function getStoredArray(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredArray(key, arr) {
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch {
    // Ignore storage quota or disabled storage
  }
}

export const notificationService = {
  getReadIds(userId) {
    if (!userId) return [];
    return getStoredArray(STORAGE_READ_KEY(userId));
  },

  getClearedIds(userId) {
    if (!userId) return [];
    return getStoredArray(STORAGE_CLEARED_KEY(userId));
  },

  markAsRead(notificationId, userId) {
    if (!userId) return;
    const ids = this.getReadIds(userId);
    if (!ids.includes(notificationId)) {
      setStoredArray(STORAGE_READ_KEY(userId), [...ids, notificationId]);
    }
  },

  markAllAsRead(notificationIds, userId) {
    if (!userId) return;
    const ids = this.getReadIds(userId);
    const merged = Array.from(new Set([...ids, ...notificationIds]));
    setStoredArray(STORAGE_READ_KEY(userId), merged);
  },

  clearAll(notificationIds = [], userId) {
    if (!userId) return;
    const cleared = this.getClearedIds(userId);
    const merged = Array.from(new Set([...cleared, ...notificationIds]));
    setStoredArray(STORAGE_CLEARED_KEY(userId), merged);
  },

  /**
   * Derives real notifications from backend task and operational metrics.
   * Categorizes into Overdue Tasks, My Assigned Tasks, and Recent Activity.
   *
   * @param {number|string|null} userId - Authenticated user's ID. Derived from AuthContext.
   */
  async getNotifications(userId) {
    if (!userId) return { notifications: [], unreadCount: 0 };

    const readIds = new Set(this.getReadIds(userId));
    const clearedIds = new Set(this.getClearedIds(userId));

    try {
      // Fetch up to 30 tasks sorted by latest updates
      const res = await taskService.getTasks({
        limit: 30,
        sort_by: 'updated_at',
        sort_order: 'desc',
      });
      const tasks = res?.items || [];
      const notifications = [];
      const now = Date.now();

      // 1. Overdue Tasks Notifications
      const overdueTasks = tasks.filter(
        (t) => t.due_date && new Date(t.due_date).getTime() < now && t.status !== 'completed'
      );
      overdueTasks.forEach((t) => {
        const id = `overdue-${t.id}`;
        if (!clearedIds.has(id)) {
          notifications.push({
            id,
            taskId: t.id,
            category: 'overdue',
            categoryLabel: 'Task Overdue',
            title: `Task '${t.title}' is overdue`,
            description: `Deadline was ${formatRelativeTime(t.due_date)} • ${t.priority.toUpperCase()} priority`,
            timestamp: t.due_date,
            link: `/tasks/${t.id}`,
            isRead: readIds.has(id),
          });
        }
      });

      // 2. Assigned To You Notifications
      const myTasks = tasks.filter(
        (t) => Number(t.assigned_to) === Number(userId) && t.status !== 'completed'
      );
      myTasks.forEach((t) => {
        const id = `assigned-${t.id}`;
        if (!clearedIds.has(id)) {
          notifications.push({
            id,
            taskId: t.id,
            category: 'assigned',
            categoryLabel: 'Assigned to You',
            title: `Task '${t.title}'`,
            description: `Status: ${t.status.replace('_', ' ')} • Priority: ${t.priority}`,
            timestamp: t.created_at,
            link: `/tasks/${t.id}`,
            isRead: readIds.has(id),
          });
        }
      });

      // 3. Recent Task Activity Notifications (Top updated tasks)
      const recentlyUpdated = tasks
        .filter((t) => t.updated_at && t.updated_at !== t.created_at)
        .slice(0, 5);

      recentlyUpdated.forEach((t) => {
        const id = `activity-${t.id}-${t.updated_at}`;
        if (!clearedIds.has(id)) {
          notifications.push({
            id,
            taskId: t.id,
            category: 'activity',
            categoryLabel: 'Recent Activity',
            title: `Task '${t.title}' was updated`,
            description: `Currently ${t.status.replace('_', ' ')} • Priority: ${t.priority}`,
            timestamp: t.updated_at,
            link: `/tasks/${t.id}`,
            isRead: readIds.has(id),
          });
        }
      });

      // Sort: Unread first, then by timestamp descending
      notifications.sort((a, b) => {
        if (a.isRead !== b.isRead) {
          return a.isRead ? 1 : -1;
        }
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      });

      const unreadCount = notifications.filter((n) => !n.isRead).length;

      return {
        notifications,
        unreadCount,
      };
    } catch {
      return {
        notifications: [],
        unreadCount: 0,
      };
    }
  },
};

export default notificationService;
