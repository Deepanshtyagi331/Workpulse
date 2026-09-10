import React from 'react';
import { Eye, Edit2, Trash2, Calendar, User, Clock } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';
import Button from '../common/Button';

export function TaskCard({
  task,
  onView,
  onEdit,
  onDelete,
  className = '',
}) {
  if (!task) return null;

  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 hover:border-slate-300 transition-all ${className}`}
    >
      {/* Header: Title & Badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-mono font-bold text-slate-400">
            TASK-{task.id}
          </span>
          <h3
            onClick={() => onView && onView(task)}
            className="text-sm font-semibold text-slate-900 truncate hover:text-indigo-600 cursor-pointer mt-0.5"
          >
            {task.title}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Meta: Assignee & Due Date */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
        <div className="flex items-center gap-1.5 truncate">
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">
            {task.assignee ? task.assignee.name : <span className="text-slate-400 italic">Unassigned</span>}
          </span>
        </div>

        <div className="flex items-center gap-1.5 truncate justify-end">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">
            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onView && onView(task)}
          icon={Eye}
          className="text-xs py-1 px-2"
        >
          View
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onEdit && onEdit(task)}
          icon={Edit2}
          className="text-xs py-1 px-2"
        >
          Edit
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete && onDelete(task)}
          icon={Trash2}
          className="text-xs py-1 px-2"
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

export default TaskCard;
