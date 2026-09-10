import React from 'react';
import { TASK_STATUS } from '../../constants';

export function StatusBadge({ status, className = '' }) {
  const normKey = (status || '').toLowerCase().replace(/[\s-]/g, '_');

  let config = TASK_STATUS.PENDING;
  if (normKey === 'in_progress' || normKey === 'inprogress') {
    config = TASK_STATUS.IN_PROGRESS;
  } else if (normKey === 'completed') {
    config = TASK_STATUS.COMPLETED;
  } else if (normKey === 'blocked') {
    config = TASK_STATUS.BLOCKED;
  } else if (normKey === 'pending') {
    config = TASK_STATUS.PENDING;
  } else {
    config = {
      label: status || 'Unknown',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      dotClass: 'bg-slate-400',
    };
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.badgeClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
}

export default StatusBadge;
