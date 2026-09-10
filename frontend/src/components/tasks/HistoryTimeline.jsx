import React from 'react';
import { History, ArrowRight } from 'lucide-react';

const ACTION_COPY = {
  created: 'created this task',
  updated: 'updated this task',
  status_changed: 'Status changed',
  priority_changed: 'Priority changed',
  assignee_changed: 'Assignee changed',
  deleted: 'deleted this task',
  attachment_uploaded: 'uploaded an attachment',
  attachment_deleted: 'deleted an attachment',
};

function formatTimestamp(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function actorName(item) {
  return item.user?.name || 'Unknown user';
}

function actionLabel(item) {
  if (item.action === 'updated' && item.field_name) {
    const labels = {
      title: 'Title changed',
      description: 'Description changed',
      due_date: 'Due date changed',
    };
    return labels[item.field_name] || 'Field updated';
  }
  return ACTION_COPY[item.action] || item.action;
}

function ChangeValues({ item }) {
  const oldDisplay = item.old_display ?? item.old_value;
  const newDisplay = item.new_display ?? item.new_value;
  if (!oldDisplay && !newDisplay) return null;
  if (item.action === 'created') return null;
  if (item.action === 'attachment_uploaded') {
    return (
      <p className="mt-1 min-w-0 break-words text-xs font-medium text-slate-800 dark:text-slate-200">
        {newDisplay || item.new_value}
      </p>
    );
  }
  if (item.action === 'attachment_deleted') {
    return (
      <p className="mt-1 min-w-0 break-words text-xs text-slate-600 dark:text-slate-400">
        {oldDisplay || item.old_value}
      </p>
    );
  }

  return (
    <p className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-600 dark:text-slate-400">
      <span className="min-w-0 break-words text-slate-500 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-600">
        {oldDisplay || '—'}
      </span>
      <ArrowRight className="h-3 w-3 shrink-0 text-slate-400 dark:text-slate-500" />
      <span className="min-w-0 break-words font-medium text-slate-800 dark:text-slate-200">{newDisplay || '—'}</span>
    </p>
  );
}

export function HistoryTimeline({ items = [] }) {
  if (!items.length) return null;

  return (
    <ol className="relative space-y-0 border-l border-slate-200 dark:border-slate-700 ml-2.5">
      {items.map((item) => (
        <li key={item.id} className="relative ml-5 pb-5 last:pb-0">
          <span className="absolute -left-[1.4375rem] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white dark:border-slate-800 bg-indigo-500 shadow-sm" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 break-words">{actorName(item)}</p>
            <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">{actionLabel(item)}</p>
            <ChangeValues item={item} />
            <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
              <History className="h-3 w-3 shrink-0" />
              {formatTimestamp(item.created_at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default HistoryTimeline;
