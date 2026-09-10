import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, RefreshCw, Mail, Shield, X, Filter, UserPlus, CheckCircle2, AlertTriangle } from 'lucide-react';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import ErrorState from '../components/feedback/ErrorState';
import UserForm from '../components/users/UserForm';
import userService from '../services/userService';
import { DEPARTMENT_COLORS } from '../utils/constants';

const DEPARTMENT_OPTIONS = [
  { value: '', label: 'All Departments' },
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Product', label: 'Product' },
  { value: 'Design', label: 'Design' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Operations', label: 'Operations' },
];

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [notification, setNotification] = useState(null);

  const fetchUsers = useCallback(async (page = 1, searchParam = search, deptParam = selectedDepartment) => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.getUsers({
        page,
        limit: 10,
        search: searchParam.trim() || undefined,
        department: deptParam || undefined,
      });
      const items = res.items || (Array.isArray(res) ? res : []);
      setUsers(items);
      setPagination({
        page: res.page || 1,
        limit: res.limit || 10,
        total: res.total ?? items.length,
        total_pages: res.total_pages || 1,
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch team members.');
    } finally {
      setLoading(false);
    }
  }, [search, selectedDepartment]);

  useEffect(() => {
    fetchUsers(1, search, selectedDepartment);
  }, [selectedDepartment]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1, search, selectedDepartment);
  };

  const handleClearSearch = () => {
    setSearch('');
    fetchUsers(1, '', selectedDepartment);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedDepartment('');
    fetchUsers(1, '', '');
  };

  // Add User Handler
  const handleCreateUser = async (userData) => {
    setFormLoading(true);
    setFormError(null);
    try {
      await userService.createUser(userData);
      setIsAddModalOpen(false);
      setNotification({ type: 'success', message: 'User created successfully.' });
      setTimeout(() => setNotification(null), 4000);
      fetchUsers(1, '', '');
    } catch (err) {
      setFormError(err.message || 'Failed to create user.');
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      header: 'Team Member',
      accessor: 'name',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 font-bold text-xs text-indigo-700 border border-indigo-100 shrink-0">
            {val ? val.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 leading-tight">{val}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3 text-slate-400" />
              <span>{row.email}</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (val) => {
        const colorClass = DEPARTMENT_COLORS[val] || DEPARTMENT_COLORS.Default;
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}>
            {val || 'General'}
          </span>
        );
      },
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (val) => (
        <span className="inline-flex items-center gap-1 text-xs text-slate-700 font-medium">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          {val || 'Member'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'is_active',
      render: (val) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
            val !== false
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${val !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {val !== false ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Joined',
      accessor: 'created_at',
      render: (val) => (
        <span className="text-xs text-slate-500">
          {val ? new Date(val).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
        </span>
      ),
    },
  ];

  const hasActiveFilters = Boolean(search.trim() || selectedDepartment);

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Team Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse registered internal team members across departments ({pagination.total} total members).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchUsers(pagination.page, search, selectedDepartment)}
            loading={loading}
            icon={RefreshCw}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={UserPlus}
            onClick={() => {
              setFormError(null);
              setIsAddModalOpen(true);
            }}
          >
            + Add User
          </Button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 relative">
            <Input
              placeholder="Search team members by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="w-full sm:w-56">
            <Select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              options={DEPARTMENT_OPTIONS}
            />
          </div>

          <Button variant="secondary" size="md" type="submit">
            Search
          </Button>

          {hasActiveFilters && (
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={handleResetFilters}
              className="text-slate-500"
            >
              Reset
            </Button>
          )}
        </form>
      </Card>

      {/* Table & Pagination */}
      {error ? (
        <ErrorState
          title="Could not load users"
          message={error}
          onRetry={() => fetchUsers(pagination.page, search, selectedDepartment)}
        />
      ) : (
        <div className="space-y-4">
          <Table
            columns={columns}
            data={users}
            isLoading={loading}
            emptyMessage={
              hasActiveFilters
                ? 'No team members match the active filters.'
                : 'No registered team members found.'
            }
          />
          {pagination.total_pages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.total_pages}
              totalItems={pagination.total}
              limit={pagination.limit}
              onPageChange={(p) => fetchUsers(p, search, selectedDepartment)}
              disabled={loading}
            />
          )}
        </div>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !formLoading && setIsAddModalOpen(false)}
        title="Add Team Member"
        subtitle="Register a new internal user to the company directory."
        size="md"
      >
        <UserForm
          onSubmit={handleCreateUser}
          onCancel={() => setIsAddModalOpen(false)}
          loading={formLoading}
          error={formError}
        />
      </Modal>
    </div>
  );
}

export default UsersPage;
