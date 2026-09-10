import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  Columns3,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';

import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/feedback/ErrorState';
import KanbanColumn from '../components/tasks/KanbanColumn';
import KanbanTaskCard from '../components/tasks/KanbanTaskCard';

import taskService from '../services/taskService';
import userService from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { KANBAN_COLUMNS } from '../constants';

export function KanbanPage() {
  const navigate = useNavigate();
  const { user: currentUser, isAdmin, isManager, isEmployee } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  const [activeTask, setActiveTask] = useState(null);
  const inFlightUpdates = useRef(new Set());
  const notifyTimer = useRef(null);
  const fetchSeq = useRef(0);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  const collisionDetection = useCallback((args) => {
    const pointerHits = pointerWithin(args);
    if (pointerHits.length > 0) return pointerHits;
    return closestCorners(args);
  }, []);

  const canDragTask = useCallback(
    (task) => {
      if (isAdmin || isManager) return true;
      if (isEmployee) return task.assigned_to === currentUser?.id;
      return false;
    },
    [isAdmin, isManager, isEmployee, currentUser]
  );

  const showNotice = useCallback((type, message) => {
    if (notifyTimer.current) clearTimeout(notifyTimer.current);
    setNotification({ type, message });
    notifyTimer.current = setTimeout(() => setNotification(null), 4500);
  }, []);

  useEffect(() => () => {
    if (notifyTimer.current) clearTimeout(notifyTimer.current);
  }, []);

  const fetchTasks = useCallback(
    async ({ silent = false } = {}) => {
      const seq = ++fetchSeq.current;
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const items = await taskService.getAllTasks({
          search: searchTerm.trim() || undefined,
          priority: priorityFilter || undefined,
          assignee: assigneeFilter ? Number(assigneeFilter) : undefined,
          sort_by: 'due_date',
          sort_order: 'asc',
        });
        if (seq !== fetchSeq.current) return;
        setTasks(items);
      } catch (err) {
        if (seq !== fetchSeq.current) return;
        setError(err.message || 'Failed to load tasks for the Kanban board.');
      } finally {
        if (seq === fetchSeq.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [searchTerm, priorityFilter, assigneeFilter]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchTasks]);

  useEffect(() => {
    let mounted = true;
    userService
      .getUsers({ limit: 100 })
      .then((res) => {
        const userList = res.items || (Array.isArray(res) ? res : []);
        if (mounted) setUsers(userList);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Real-time WebSocket event listeners for Kanban board
  const { subscribe } = useWebSocket();
  useEffect(() => {
    const unsubCreate = subscribe('task.created', () => {
      fetchTasks({ silent: true });
    });

    const unsubStatus = subscribe('task.status_changed', (event) => {
      if (!event.data?.id) return;
      // If task is currently being dragged locally, do not interfere
      if (inFlightUpdates.current.has(event.data.id)) return;

      setTasks((prev) => {
        const exists = prev.some((t) => t.id === event.data.id);
        if (exists) {
          return prev.map((t) => (t.id === event.data.id ? { ...t, ...event.data } : t));
        }
        return [...prev, event.data];
      });
    });

    const unsubUpdate = subscribe('task.updated', (event) => {
      if (!event.data?.id) return;
      if (inFlightUpdates.current.has(event.data.id)) return;
      setTasks((prev) =>
        prev.map((t) => (t.id === event.data.id ? { ...t, ...event.data } : t))
      );
    });

    const unsubPriority = subscribe('task.priority_changed', (event) => {
      if (!event.data?.id) return;
      setTasks((prev) =>
        prev.map((t) => (t.id === event.data.id ? { ...t, ...event.data } : t))
      );
    });

    const unsubAssignee = subscribe('task.assignee_changed', (event) => {
      if (!event.data?.id) return;
      setTasks((prev) =>
        prev.map((t) => (t.id === event.data.id ? { ...t, ...event.data } : t))
      );
    });

    const unsubDelete = subscribe('task.deleted', (event) => {
      if (!event.entity_id) return;
      setTasks((prev) => prev.filter((t) => t.id !== event.entity_id));
    });

    return () => {
      unsubCreate();
      unsubStatus();
      unsubUpdate();
      unsubPriority();
      unsubAssignee();
      unsubDelete();
    };
  }, [subscribe, fetchTasks]);

  const tasksByStatus = useMemo(() => {
    const grouped = {
      pending: [],
      in_progress: [],
      blocked: [],
      completed: [],
    };
    tasks.forEach((task) => {
      const key = (task.status || 'pending').toLowerCase();
      if (grouped[key]) grouped[key].push(task);
      else grouped.pending.push(task);
    });
    return grouped;
  }, [tasks]);

  const hasActiveFilters = Boolean(searchTerm || priorityFilter || assigneeFilter);

  const resolveDropStatus = (over) => {
    if (!over) return null;
    const fromData = over.data?.current?.status;
    if (fromData && KANBAN_COLUMNS.some((col) => col.key === fromData)) {
      return fromData;
    }
    if (KANBAN_COLUMNS.some((col) => col.key === over.id)) return over.id;
    return null;
  };

  const persistStatusChange = async (task, nextStatus) => {
    if (inFlightUpdates.current.has(task.id)) return;
    inFlightUpdates.current.add(task.id);

    const previousStatus = task.status;
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item))
    );

    try {
      const updated = await taskService.updateTask(task.id, { status: nextStatus });
      setTasks((current) =>
        current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
      );
    } catch (err) {
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, status: previousStatus } : item
        )
      );
      const status = err.status;
      let message = err.message || 'Could not update task status.';
      if (status === 403) {
        message = err.message || 'You do not have permission to move this task.';
      } else if (status === 404) {
        message = 'That task could not be found. The board was restored.';
        fetchTasks({ silent: true });
      } else if (status === 401) {
        message = 'Your session expired. Please sign in again.';
      }
      showNotice('error', message);
    } finally {
      inFlightUpdates.current.delete(task.id);
    }
  };

  const handleDragStart = (event) => {
    const taskId = event.active.data?.current?.taskId;
    const task = tasks.find((item) => item.id === taskId) || null;
    setActiveTask(task);
  };

  const handleDragCancel = () => {
    setActiveTask(null);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.data?.current?.taskId;
    const fromStatus = active.data?.current?.status;
    const toStatus = resolveDropStatus(over);

    if (!taskId || !toStatus || !fromStatus) return;
    if (fromStatus === toStatus) return;

    await persistStatusChange({ id: taskId, status: fromStatus }, toStatus);
  };

  const handleOpenTask = (task) => {
    navigate(`/tasks/${task.id}`);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setPriorityFilter('');
    setAssigneeFilter('');
  };

  return (
    <div className="space-y-6 overflow-x-hidden pb-8">
      {notification && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-xs font-medium shadow-sm ${
            notification.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          )}
          <span className="flex-1">{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="shrink-0 rounded p-0.5 text-current opacity-70 hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Kanban</h1>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
            Drag tasks between status columns. Changes are saved through the existing task API.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchTasks({ silent: true })}
          loading={refreshing}
          icon={RefreshCw}
        >
          Refresh
        </Button>
      </div>

      <Card className="space-y-3 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Input
              placeholder="Search title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            placeholder="All Priorities"
            options={[
              { value: '', label: 'All Priorities' },
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]}
          />
          <Select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            placeholder="All Assignees"
            options={[
              { value: '', label: 'All Assignees' },
              ...users.map((u) => ({ value: String(u.id), label: u.name })),
            ]}
          />
        </div>
        {hasActiveFilters && (
          <div className="flex items-center justify-end border-t border-slate-100 pt-2">
            <Button variant="ghost" size="sm" icon={X} onClick={handleClearFilters}>
              Clear filters
            </Button>
          </div>
        )}
      </Card>

      {loading ? (
        <Card className="py-16">
          <LoadingSpinner size="lg" label="Loading board..." />
        </Card>
      ) : error ? (
        <ErrorState
          title="Unable to load Kanban board"
          message={error}
          onRetry={() => fetchTasks()}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex gap-3 overflow-x-auto pb-2">
            {KANBAN_COLUMNS.map((column) => (
              <KanbanColumn
                key={column.key}
                column={column}
                tasks={tasksByStatus[column.key] || []}
                canDragTask={canDragTask}
                onOpenTask={handleOpenTask}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={null}>
            {activeTask ? (
              <div className="w-[260px]">
                <KanbanTaskCard task={activeTask} canDrag isOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {!loading && !error && tasks.length === 0 && (
        <p className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <Columns3 className="h-3.5 w-3.5" />
          No tasks match the current filters. Columns remain available for drop targets after tasks load.
        </p>
      )}
    </div>
  );
}

export default KanbanPage;
