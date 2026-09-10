import React from 'react';
import { Flag, AlertCircle } from 'lucide-react';
import { TASK_PRIORITY } from '../../constants';

export function PriorityBadge({ priority, className = '' }) {
  const normKey = (priority || '').toLowerCase();

  let config = TASK_PRIORITY.MEDIUM;
  if (normKey === 'low') {
    config = TASK_PRIORITY.LOW;
  } else if (normKey === 'medium') {
    config = TASK_PRIORITY.MEDIUM;
  } else if (normKey === 'high') {
    config = TASK_PRIORITY.HIGH;
  } else if (normKey === 'urgent') {
    config = TASK_PRIORITY.URGENT;
  } else {
    config = {
      label: priority || 'Medium',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      dotClass: 'bg-slate-400',
    };
  }

  const isUrgent = normKey === 'urgent';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.badgeClass} ${className}`}
    >
      {isUrgent ? (
        <AlertCircle className="w-3 h-3 text-rose-500 animate-pulse" />
      ) : (
        <Flag className="w-3 h-3 text-current opacity-70" />
      )}
      {config.label}
    </span>
  );
}

export default PriorityBadge;
