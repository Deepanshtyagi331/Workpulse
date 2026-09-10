import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckSquare,
  Clock,
  Activity,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  UserCheck,
  Users,
  Building2,
  RefreshCw,
  Plus,
  ArrowRight,
  ExternalLink,
  Shield,
  Layers,
  Calendar,
  Sparkles,
} from 'lucide-react';

import Card from '../components/common/Card';
import StatCard from '../components/common/StatCard';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/feedback/ErrorState';
import dashboardService from '../services/dashboardService';
import { TASK_STATUS, TASK_PRIORITY } from '../constants';
import { DEPARTMENT_COLORS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Dynamic time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Formatted current date
  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date());
  }, []);

  const fetchDashboard = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // JWT in Authorization header via apiClient — backend derives user from token
      const res = await dashboardService.getDashboard();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch real-time dashboard metrics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard(false);
  }, []);

  // Calculated percentage helpers guarded against division-by-zero
  const calculatePercentage = (count, total) => {
    if (!total || total <= 0 || !count) return 0;
    return Math.round((count / total) * 100);
  };

  // Status breakdown calculations
  const statusBreakdown = useMemo(() => {
    if (!data) return [];
    const total = data.total_tasks || 0;

    return [
      {
        key: 'completed',
        label: 'Completed',
        count: data.completed_tasks || 0,
        percentage: calculatePercentage(data.completed_tasks, total),
        barColor: 'bg-emerald-500',
        textColor: 'text-emerald-700',
        bgLight: 'bg-emerald-50',
      },
      {
        key: 'in_progress',
        label: 'In Progress',
        count: data.in_progress_tasks || 0,
        percentage: calculatePercentage(data.in_progress_tasks, total),
        barColor: 'bg-blue-500',
        textColor: 'text-blue-700',
        bgLight: 'bg-blue-50',
      },
      {
        key: 'pending',
        label: 'Pending',
        count: data.pending_tasks || 0,
        percentage: calculatePercentage(data.pending_tasks, total),
        barColor: 'bg-amber-500',
        textColor: 'text-amber-700',
        bgLight: 'bg-amber-50',
      },
      {
        key: 'blocked',
        label: 'Blocked',
        count: data.blocked_tasks || 0,
        percentage: calculatePercentage(data.blocked_tasks, total),
        barColor: 'bg-rose-500',
        textColor: 'text-rose-700',
        bgLight: 'bg-rose-50',
      },
    ];
  }, [data]);

  // Priority breakdown calculations
  const priorityBreakdown = useMemo(() => {
    if (!data) return [];
    const total = data.total_tasks || 0;
    const dist = data.priority_distribution || {};

    const priorities = [
      {
        key: 'urgent',
        label: 'Urgent',
        count: dist.urgent || 0,
        barColor: 'bg-rose-500',
        textColor: 'text-rose-700',
      },
      {
        key: 'high',
        label: 'High',
        count: dist.high || 0,
        barColor: 'bg-amber-500',
        textColor: 'text-amber-700',
      },
      {
        key: 'medium',
        label: 'Medium',
        count: dist.medium || 0,
        barColor: 'bg-sky-500',
        textColor: 'text-sky-700',
      },
      {
        key: 'low',
        label: 'Low',
        count: dist.low || 0,
        barColor: 'bg-slate-400',
        textColor: 'text-slate-600',
      },
    ];

    return priorities.map((p) => ({
      ...p,
      percentage: calculatePercentage(p.count, total),
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="py-24">
        <LoadingSpinner size="lg" label="Synchronizing dashboard metrics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 max-w-2xl mx-auto">
        <ErrorState
          title="Dashboard Feed Unavailable"
          message={error}
          onRetry={() => fetchDashboard(false)}
        />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Greeting Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {greeting}, {user?.name ?? '…'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Here's what's happening across your team's operational workflows and tasks.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchDashboard(true)}
            loading={refreshing}
            icon={RefreshCw}
            title="Fetch real-time updates from API"
          >
            Refresh Feed
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/tasks')}
            icon={Plus}
          >
            Create Task
          </Button>
        </div>
      </div>

      {/* 2. Main KPI Cards Section */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Operational KPIs
          </h2>
          <span className="text-[11px] text-slate-500">
            Real-time counts aggregated at database level
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Tasks"
            value={data.total_tasks}
            icon={CheckSquare}
            tone="indigo"
            description={`${data.completed_tasks} completed overall`}
            onClick={() => navigate('/tasks')}
          />

          <StatCard
            title="In Progress"
            value={data.in_progress_tasks}
            icon={Activity}
            tone="blue"
            description="Active workflows underway"
            onClick={() => navigate('/tasks')}
          />

          <StatCard
            title="Overdue Tasks"
            value={data.overdue_tasks}
            icon={AlertTriangle}
            tone={data.overdue_tasks > 0 ? 'rose' : 'slate'}
            isPositive={data.overdue_tasks === 0}
            change={data.overdue_tasks > 0 ? 'Requires attention' : 'All deadlines on track'}
            onClick={() => navigate('/tasks')}
          />

          <StatCard
            title="My Assigned Tasks"
            value={data.my_tasks}
            icon={UserCheck}
            tone="emerald"
            description={`Assigned to ${user?.name ?? 'you'}`}
            onClick={() => navigate(`/tasks?assignee=${user?.id ?? ''}`)}
          />
        </div>

        {/* Secondary KPI Status Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <StatCard
            title="Pending"
            value={data.pending_tasks}
            icon={Clock}
            tone="amber"
            description="Queued awaiting assignment/start"
            onClick={() => navigate('/tasks')}
          />

          <StatCard
            title="Completed"
            value={data.completed_tasks}
            icon={CheckCircle2}
            tone="emerald"
            description={`${calculatePercentage(data.completed_tasks, data.total_tasks)}% completion rate`}
            onClick={() => navigate('/tasks')}
          />

          <StatCard
            title="Blocked"
            value={data.blocked_tasks}
            icon={AlertOctagon}
            tone={data.blocked_tasks > 0 ? 'rose' : 'slate'}
            isPositive={data.blocked_tasks === 0}
            change={data.blocked_tasks > 0 ? 'Action required' : 'No impediments'}
            onClick={() => navigate('/tasks')}
          />
        </div>
      </div>

      {/* 3 & 4. Visualizations: Task Status Overview & Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Overview */}
        <Card
          title="Task Status Overview"
          subtitle="Proportional breakdown across workflow lifecycle"
          headerBorder={true}
        >
          {data.total_tasks === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No tasks currently tracked in the database.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stacked Cumulative Visual Bar */}
              <div>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
                  {statusBreakdown.map((status) =>
                    status.count > 0 ? (
                      <div
                        key={status.key}
                        className={`h-full first:rounded-l-full last:rounded-r-full transition-all duration-300 ${status.barColor}`}
                        style={{ width: `${status.percentage}%` }}
                        title={`${status.label}: ${status.count} (${status.percentage}%)`}
                      />
                    ) : null
                  )}
                </div>
              </div>

              {/* Status List with Visual Percent Bars */}
              <div className="space-y-3 pt-2">
                {statusBreakdown.map((status) => (
                  <div key={status.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={status.key} />
                        <span className="font-semibold text-slate-700">{status.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{status.count}</span>
                        <span className="text-slate-400 text-[11px] w-10 text-right">
                          ({status.percentage}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${status.barColor}`}
                        style={{ width: `${status.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Priority Distribution */}
        <Card
          title="Priority Distribution"
          subtitle="Task severity mapping across project backlog"
          headerBorder={true}
        >
          {data.total_tasks === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No task priorities recorded.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Distribution bars */}
              <div className="space-y-3.5">
                {priorityBreakdown.map((p) => (
                  <div key={p.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={p.key} />
                        <span className="text-slate-700 font-medium">{p.label} Priority</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="font-bold text-slate-900">{p.count} tasks</span>
                        <span className="text-slate-400 w-10 text-right">({p.percentage}%)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${p.barColor}`}
                        style={{ width: `${p.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Highest Urgency:</span>
                <span className="font-semibold text-rose-600">
                  {(data.priority_distribution?.urgent || 0) + (data.priority_distribution?.high || 0)} Critical Tasks
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 5, 6, 7 & 8: Team Overview, My Work, Activity Feed, Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 5. Team Overview */}
        <Card
          title="Team Overview"
          subtitle="Directory health and department allocation"
          headerBorder={true}
          action={
            <Link
              to="/users"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          <div className="space-y-4">
            {/* Team summary badges */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="block text-lg font-bold text-slate-900">{data.total_users || 0}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wide">Total</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="block text-lg font-bold text-emerald-700">{data.active_users || 0}</span>
                <span className="text-[10px] text-emerald-600 uppercase tracking-wide">Active</span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
                <span className="block text-lg font-bold text-indigo-700">{data.departments_count || 0}</span>
                <span className="text-[10px] text-indigo-600 uppercase tracking-wide">Depts</span>
              </div>
            </div>

            {/* Department distribution list */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Department Distribution
              </p>
              <div className="space-y-2">
                {Object.entries(data.department_distribution || {}).map(([dept, count]) => {
                  const colorClass = DEPARTMENT_COLORS[dept] || DEPARTMENT_COLORS.Default;
                  return (
                    <div
                      key={dept}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50/80 border border-slate-100 text-xs"
                    >
                      <span className={`px-2 py-0.5 rounded font-medium border ${colorClass}`}>
                        {dept}
                      </span>
                      <span className="font-semibold text-slate-700">{count} members</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* 6. My Work & Quick Actions Card */}
        <div className="space-y-6">
          {/* My Work Section */}
          <Card
            title="My Work"
            subtitle="Current user assignment focus"
            headerBorder={true}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm">
                    {user ? (() => { const p = (user.name||'').trim().split(' '); return p.length >= 2 ? (p[0][0]+p[p.length-1][0]).toUpperCase() : (user.name||'??').slice(0,2).toUpperCase(); })() : '??'}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{user?.name ?? '…'}</h4>
                     <p className="text-xs text-slate-500">{user?.role ?? ''} • {user?.department ?? ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-indigo-700">{data.my_tasks}</span>
                  <span className="block text-[10px] uppercase tracking-wide text-indigo-500 font-semibold">
                    Tasks
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => navigate('/tasks?assignee=2')}
                >
                  <span>Open My Task Queue</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Quick Actions Section */}
          <Card
            title="Quick Navigation"
            subtitle="Common administrative pathways"
            headerBorder={true}
          >
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="justify-start text-xs text-slate-700"
                onClick={() => navigate('/tasks')}
                icon={Plus}
              >
                Create New Task
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="justify-start text-xs text-slate-700"
                onClick={() => navigate('/tasks')}
                icon={CheckSquare}
              >
                View All Tasks Queue
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="justify-start text-xs text-slate-700"
                onClick={() => navigate('/users')}
                icon={Users}
              >
                Manage Team Directory
              </Button>
            </div>
          </Card>
        </div>

        {/* 7. Recent Activity Feed */}
        <Card
          title="Recent Activity"
          subtitle="Real-time audit and system synchronizations"
          headerBorder={true}
        >
          {(!data.recent_activity || data.recent_activity.length === 0) ? (
            <div className="py-8 text-center text-slate-400 text-xs italic">
              No recent activity recorded.
            </div>
          ) : (
            <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {data.recent_activity.map((item, idx) => (
                <div key={item.id || idx} className="relative group">
                  {/* Timeline bullet dot */}
                  <span className="absolute -left-4 top-1.5 h-2 w-2 rounded-full ring-4 ring-white bg-indigo-600" />
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900">{item.title}</span>
                      <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;
