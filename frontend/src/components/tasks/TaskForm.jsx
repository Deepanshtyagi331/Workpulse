import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import userService from '../../services/userService';

export function TaskForm({
  initialData = null,
  onSubmit,
  onCancel,
  loading = false,
  error: submitError = null,
  isEmployee = false,
}) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    status: initialData?.status || 'pending',
    priority: initialData?.priority || 'medium',
    assigned_to: initialData?.assigned_to || (initialData?.assignee?.id ?? ''),
    due_date: initialData?.due_date
      ? new Date(initialData.due_date).toISOString().slice(0, 16)
      : '',
  });

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let isMounted = true;
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await userService.getUsers({ limit: 100 });
        const userList = res.items || (Array.isArray(res) ? res : []);
        if (isMounted) {
          setUsers(userList);
        }
      } catch (err) {
        console.warn('Could not load users for task assignment dropdown:', err);
      } finally {
        if (isMounted) setLoadingUsers(false);
      }
    };

    loadUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  const validate = () => {
    const errors = {};
    const trimmedTitle = formData.title.trim();
    if (!trimmedTitle) {
      errors.title = 'Title is required';
    } else if (trimmedTitle.length < 3) {
      errors.title = 'Title must be at least 3 characters';
    } else if (trimmedTitle.length > 200) {
      errors.title = 'Title cannot exceed 200 characters';
    }

    if (formData.description && formData.description.length > 5000) {
      errors.description = 'Description cannot exceed 5000 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      status: formData.status,
      priority: formData.priority,
      assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
      due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {submitError}
        </div>
      )}

      {/* Task Title */}
      <Input
        label="Task Title"
        name="title"
        required={true}
        placeholder="e.g. Implement user authentication workflow"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        error={fieldErrors.title}
        disabled={loading}
      />

      {/* Description */}
      <div className="w-full space-y-1.5 text-left">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Description
        </label>
        <textarea
          name="description"
          rows={3}
          placeholder="Detailed task specifications and acceptance criteria..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          disabled={loading}
          className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-100"
        />
        {fieldErrors.description && (
          <p className="text-xs text-rose-600 font-medium">{fieldErrors.description}</p>
        )}
      </div>

      {/* Status & Priority Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Status"
          name="status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
            { value: 'blocked', label: 'Blocked' },
          ]}
          disabled={loading}
        />

        <Select
          label="Priority"
          name="priority"
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'urgent', label: 'Urgent' },
          ]}
          disabled={loading}
        />
      </div>

      {/* Assignee & Due Date Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Select
            label="Assignee"
            name="assigned_to"
            placeholder="Unassigned"
            value={formData.assigned_to}
            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
            options={[
              { value: '', label: 'Unassigned' },
              ...users.map((u) => ({
                value: u.id,
                label: `${u.name} (${u.role || u.department || 'User'})`,
              })),
            ]}
            disabled={loading || loadingUsers || isEmployee}
          />
          {isEmployee && (
            <p className="text-[10px] text-slate-400 mt-1">
              Employees cannot reassign tasks to other team members.
            </p>
          )}
        </div>

        <div className="w-full space-y-1.5 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Due Date & Time
          </label>
          <input
            type="datetime-local"
            name="due_date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            disabled={loading}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-100"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
        >
          {initialData ? 'Save Changes' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}

export default TaskForm;
