import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckSquare,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  Filter,
  ArrowUpDown,
  X,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/feedback/EmptyState';
import ErrorState from '../components/feedback/ErrorState';
import TaskCard from '../components/tasks/TaskCard';
import TaskForm from '../components/tasks/TaskForm';

import taskService from '../services/taskService';
import userService from '../services/userService';
import { useAuth } from '../context/AuthContext';

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Newest First (Created)' },
  { value: 'created_at:asc', label: 'Oldest First (Created)' },
  { value: 'due_date:asc', label: 'Due Date (Earliest)' },
  { value: 'due_date:desc', label: 'Due Date (Latest)' },
  { value: 'priority:desc', label: 'Priority (Highest)' },
  { value: 'status:asc', label: 'Status' },
  { value: 'title:asc', label: 'Title (A-Z)' },
];

export function TasksPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser, isAdmin, isManager, isEmployee } = useAuth();
  const canCreateTask = isAdmin || isManager;
  const canDeleteAnyTask = isAdmin || isManager;

  const canEditTask = useCallback((task) => {
    if (isAdmin || isManager) return true;
    if (isEmployee) return task.assigned_to === currentUser?.id;
    return false;
  }, [isAdmin, isManager, isEmployee, currentUser]);

  const canDeleteTask = useCallback((task) => {
    return isAdmin || isManager;
  }, [isAdmin, isManager]);

  // Tasks and metadata state
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Available users for assignee filter
  const [users, setUsers] = useState([]);

  // Active filter state initialized from URL query params
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '');
  const [assigneeFilter, setAssigneeFilter] = useState(searchParams.get('assignee') || '');
  const [sortKey, setSortKey] = useState(
    `${searchParams.get('sort_by') || 'created_at'}:${searchParams.get('sort_order') || 'desc'}`
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page'), 10) || 1
  );

  // Modal dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Load team directory for the assignee filter dropdown
  useEffect(() => {
    let isMounted = true;
    userService.getUsers({ limit: 100 }).then((res) => {
      const userList = res.items || (Array.isArray(res) ? res : []);
      if (isMounted) setUsers(userList);
    }).catch((err) => console.warn('Assignee list load error:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronize URL search params with active state
  useEffect(() => {
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (statusFilter) params.status = statusFilter;
    if (priorityFilter) params.priority = priorityFilter;
    if (assigneeFilter) params.assignee = assigneeFilter;

    const [sortBy, sortOrder] = sortKey.split(':');
    if (sortBy !== 'created_at') params.sort_by = sortBy;
    if (sortOrder !== 'desc') params.sort_order = sortOrder;
    if (currentPage > 1) params.page = currentPage;

    setSearchParams(params, { replace: true });
  }, [searchTerm, statusFilter, priorityFilter, assigneeFilter, sortKey, currentPage, setSearchParams]);

  // Main fetch function executing backend queries
  const fetchTasks = useCallback(async (targetPage = currentPage) => {
    setLoading(true);
    setError(null);

    const [sortBy, sortOrder] = sortKey.split(':');

    try {
      const queryParams = {
        page: targetPage,
        limit: 10,
        search: searchTerm.trim() || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        assignee: assigneeFilter ? Number(assigneeFilter) : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      const res = await taskService.getTasks(queryParams);
      setTasks(res.items || []);
      setPagination({
        page: res.page || targetPage,
        limit: res.limit || 10,
        total: res.total || 0,
        total_pages: res.total_pages || 1,
      });
      setCurrentPage(res.page || targetPage);
    } catch (err) {
      setError(err.message || 'Failed to load tasks from server.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, priorityFilter, assigneeFilter, sortKey, currentPage]);

  // Trigger fetch when search or filters change with debounce for text input
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks(currentPage);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchTasks, currentPage]);

  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPriorityFilter('');
    setAssigneeFilter('');
    setSortKey('created_at:desc');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    searchTerm || statusFilter || priorityFilter || assigneeFilter || sortKey !== 'created_at:desc'
  );

  // Task Creation Handler
  const handleCreateTask = async (payload) => {
    setFormLoading(true);
    setFormError(null);
    try {
      await taskService.createTask(payload);
      setIsCreateOpen(false);
      setNotification({ type: 'success', message: 'Task created successfully!' });
      setTimeout(() => setNotification(null), 4000);
      fetchTasks(1);
    } catch (err) {
      setFormError(err.message || 'Failed to create task.');
    } finally {
      setFormLoading(false);
    }
  };

  // Task Update Handler
  const handleUpdateTask = async (payload) => {
    if (!editingTask) return;
    setFormLoading(true);
    setFormError(null);
    try {
      await taskService.updateTask(editingTask.id, payload);
      setEditingTask(null);
      setNotification({ type: 'success', message: `Task #${editingTask.id} updated successfully!` });
      setTimeout(() => setNotification(null), 4000);
      fetchTasks(currentPage);
    } catch (err) {
      setFormError(err.message || 'Failed to update task.');
    } finally {
      setFormLoading(false);
    }
  };

  // Task Deletion Handler
  const handleDeleteTask = async () => {
    if (!deletingTask) return;
    setFormLoading(true);
    try {
      await taskService.deleteTask(deletingTask.id);
      const targetPage = tasks.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      setDeletingTask(null);
      setNotification({ type: 'success', message: `Task #${deletingTask.id} deleted.` });
      setTimeout(() => setNotification(null), 4000);
      fetchTasks(targetPage);
    } catch (err) {
      setNotification({ type: 'error', message: `Could not delete task: ${err.message}` });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setFormLoading(false);
    }
  };

  // Desktop Table Column Configuration
  const columns = [
    {
      header: 'Task Title',
      accessor: 'title',
      className: 'min-w-[240px]',
      render: (val, row) => (
        <div>
          <button
            onClick={() => navigate(`/tasks/${row.id}`)}
            className="text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors text-left block truncate max-w-sm"
          >
            {val}
          </button>
          {row.description && (
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (val) => <PriorityBadge priority={val} />,
    },
    {
      header: 'Assignee',
      accessor: 'assignee',
      render: (val) => (
        <span className="text-xs font-medium text-slate-700">
          {val ? val.name : <span className="text-slate-400 italic">Unassigned</span>}
        </span>
      ),
    },
    {
      header: 'Due Date',
      accessor: 'due_date',
      render: (val) => (
        <span className="text-xs text-slate-600">
          {val ? new Date(val).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Created',
      accessor: 'created_at',
      render: (val) => (
        <span className="text-xs text-slate-400">
          {val ? new Date(val).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/tasks/${row.id}`)}
            icon={Eye}
            title="View Details"
            className="p-1.5 h-8 w-8 text-slate-500 hover:text-slate-900"
          />
          {canEditTask(row) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingTask(row)}
              icon={Edit2}
              title="Edit Task"
              className="p-1.5 h-8 w-8 text-slate-500 hover:text-indigo-600"
            />
          )}
          {canDeleteTask(row) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeletingTask(row)}
              icon={Trash2}
              title="Delete Task"
              className="p-1.5 h-8 w-8 text-slate-500 hover:text-rose-600"
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`flex items-center gap-2.5 p-3.5 rounded-xl text-xs font-medium border shadow-sm animate-in fade-in duration-200 ${
            notification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Tasks</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage, filter, and prioritize operational workflows across all team queues.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchTasks(currentPage)}
            loading={loading}
            icon={RefreshCw}
            title="Refresh current view"
          >
            Refresh
          </Button>
          {canCreateTask && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setFormError(null);
                setIsCreateOpen(true);
              }}
              icon={Plus}
            >
              Create Task
            </Button>
          )}
        </div>
      </div>

      {/* 2 & 3 & 4. Filter & Search Toolbar */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2">
            <Input
              placeholder="Search title or description..."
              value={searchTerm}
              onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
              icon={Search}
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
            placeholder="All Statuses"
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'blocked', label: 'Blocked' },
            ]}
          />

          {/* Priority Filter */}
          <Select
            value={priorityFilter}
            onChange={(e) => handleFilterChange(setPriorityFilter, e.target.value)}
            placeholder="All Priorities"
            options={[
              { value: '', label: 'All Priorities' },
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]}
          />

          {/* Assignee Filter */}
          <Select
            value={assigneeFilter}
            onChange={(e) => handleFilterChange(setAssigneeFilter, e.target.value)}
            placeholder="All Assignees"
            options={[
              { value: '', label: 'All Assignees' },
              ...users.map((u) => ({
                value: String(u.id),
                label: u.name,
              })),
            ]}
          />
        </div>

        {/* Sort & Filter Reset Toolbar Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-600">Sort by:</span>
            <select
              value={sortKey}
              onChange={(e) => handleFilterChange(setSortKey, e.target.value)}
              className="rounded-lg border border-slate-200 bg-white py-1 px-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
            <span className="text-slate-400">
              Total: <strong className="text-slate-700">{pagination.total}</strong> tasks
            </span>
          </div>
        </div>
      </Card>

      {/* 5. Main Content: Loading, Error, Empty, Desktop Table & Mobile Cards */}
      {loading && tasks.length === 0 ? (
        <div className="py-20">
          <LoadingSpinner size="lg" label="Querying task database..." />
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load tasks"
          message={error}
          onRetry={() => fetchTasks(currentPage)}
        />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description={
            hasActiveFilters
              ? 'No tasks matched your active search or filter criteria. Try resetting filters.'
              : 'There are currently no tasks created in the system.'
          }
          actionLabel={hasActiveFilters ? 'Clear Filters' : 'Create First Task'}
          onAction={hasActiveFilters ? handleClearFilters : () => setIsCreateOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table
              columns={columns}
              data={tasks}
              isLoading={loading}
              emptyMessage="No tasks found."
            />
          </div>

          {/* Mobile Stacked Card View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onView={() => navigate(`/tasks/${task.id}`)}
                onEdit={canEditTask(task) ? () => setEditingTask(task) : undefined}
                onDelete={canDeleteTask(task) ? () => setDeletingTask(task) : undefined}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.total_pages}
            totalItems={pagination.total}
            limit={pagination.limit}
            onPageChange={(p) => fetchTasks(p)}
            disabled={loading}
          />
        </div>
      )}

      {/* 6. Create Task Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Task"
        subtitle="Specify task scope, urgency, and assign team member."
        size="lg"
      >
        <TaskForm
          onSubmit={handleCreateTask}
          onCancel={() => setIsCreateOpen(false)}
          loading={formLoading}
          error={formError}
        />
      </Modal>

      {/* 7. Edit Task Modal */}
      <Modal
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        title={`Edit Task #${editingTask?.id}`}
        subtitle="Update attributes, status, or assignee."
        size="lg"
      >
        {editingTask && (
          <TaskForm
            initialData={editingTask}
            onSubmit={handleUpdateTask}
            onCancel={() => setEditingTask(null)}
            loading={formLoading}
            error={formError}
            isEmployee={isEmployee}
          />
        )}
      </Modal>

      {/* 8. Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingTask)}
        onClose={() => setDeletingTask(null)}
        title="Delete Task"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeletingTask(null)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteTask}
              loading={formLoading}
            >
              Delete Task
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Are you sure you want to delete this task?
            </p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Task <strong className="text-slate-700">"{deletingTask?.title}"</strong> and all its
              associated comments will be permanently removed. This action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default TasksPage;
