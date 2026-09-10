import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const DEPARTMENT_OPTIONS = [
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Product', label: 'Product' },
  { value: 'Design', label: 'Design' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Quality Assurance', label: 'Quality Assurance' },
  { value: 'Security', label: 'Security' },
];

const ROLE_OPTIONS_FOR_ADMIN = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
];

const ROLE_OPTIONS_FOR_MANAGER = [
  { value: 'employee', label: 'Employee' },
];

export function UserForm({
  onSubmit,
  onCancel,
  loading = false,
  error: submitError = null,
  isAdmin = false,
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Engineering',
    role: '',
    app_role: 'employee',
    is_active: true,
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errors = {};
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedDept = formData.department.trim();
    const trimmedRole = formData.role.trim();

    if (!trimmedName) {
      errors.name = 'Full name is required';
    } else if (trimmedName.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (trimmedName.length > 100) {
      errors.name = 'Name cannot exceed 100 characters';
    }

    if (!trimmedEmail) {
      errors.email = 'Corporate email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please provide a valid email address';
    }

    if (!trimmedDept) {
      errors.department = 'Department is required';
    } else if (trimmedDept.length < 2) {
      errors.department = 'Department must be at least 2 characters';
    }

    if (!trimmedRole) {
      errors.role = 'Role or job title is required';
    } else if (trimmedRole.length < 2) {
      errors.role = 'Role must be at least 2 characters';
    } else if (trimmedRole.length > 50) {
      errors.role = 'Role cannot exceed 50 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      department: formData.department.trim(),
      role: formData.role.trim(),
      app_role: formData.app_role || 'employee',
      is_active: Boolean(formData.is_active),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 animate-in fade-in duration-150">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{submitError}</span>
        </div>
      )}

      {/* Full Name */}
      <Input
        label="Full Name"
        id="user-name"
        name="name"
        placeholder="e.g. Samantha Wu"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        error={fieldErrors.name}
        required
        disabled={loading}
      />

      {/* Corporate Email */}
      <Input
        label="Corporate Email"
        id="user-email"
        name="email"
        type="email"
        placeholder="e.g. samantha.wu@workpulse.internal"
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        error={fieldErrors.email}
        required
        disabled={loading}
      />

      {/* Department, Job Role & App Role Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Department"
          id="user-department"
          name="department"
          value={formData.department}
          onChange={(e) => handleChange('department', e.target.value)}
          options={DEPARTMENT_OPTIONS}
          error={fieldErrors.department}
          required
          disabled={loading}
        />

        <Input
          label="Job Role / Title"
          id="user-role"
          name="role"
          placeholder="e.g. Frontend Engineer"
          value={formData.role}
          onChange={(e) => handleChange('role', e.target.value)}
          error={fieldErrors.role}
          required
          disabled={loading}
        />
      </div>

      {/* App Authorization Role */}
      <div>
        <Select
          label="Application Role (RBAC)"
          id="user-app-role"
          name="app_role"
          value={formData.app_role}
          onChange={(e) => handleChange('app_role', e.target.value)}
          options={isAdmin ? ROLE_OPTIONS_FOR_ADMIN : ROLE_OPTIONS_FOR_MANAGER}
          disabled={loading}
        />
        <p className="text-[11px] text-slate-400 mt-1">
          {isAdmin
            ? 'Admins can assign employee, manager, or admin permissions.'
            : 'Managers can create users with employee permissions.'}
        </p>
      </div>

      {/* Status Toggle */}
      <div className="pt-1">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
          Initial Status
        </label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
            <input
              type="radio"
              name="is_active"
              checked={formData.is_active === true}
              onChange={() => handleChange('is_active', true)}
              disabled={loading}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            <span>Active</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
            <input
              type="radio"
              name="is_active"
              checked={formData.is_active === false}
              onChange={() => handleChange('is_active', false)}
              disabled={loading}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            <span>Inactive</span>
          </label>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
          Create User
        </Button>
      </div>
    </form>
  );
}

export default UserForm;
