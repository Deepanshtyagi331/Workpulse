import React, { useCallback, useRef } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Calendar, User, GripVertical, AlertTriangle } from 'lucide-react';
import PriorityBadge from '../common/PriorityBadge';

function isOverdue(task) {
  if (!task?.due_date || task.status === 'completed') return false;
  return new Date(task.due_date).getTime() < Date.now();
}

function formatDueDate(dueDate) {
  if (!dueDate) return 'No due date';
  return new Date(dueDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function KanbanTaskCard({
  task,
  canDrag = true,
  isOverlay = false,
  onOpen,
}) {
  const overdue = isOverdue(task);
  const suppressClickRef = useRef(false);

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-task-${task.id}`,
    data: {
      type: 'card',
      status: task.status,
      taskId: task.id,
    },
    disabled: isOverlay,
  });

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: {
      type: 'task',
      taskId: task.id,
      status: task.status,
    },
    disabled: !canDrag || isOverlay,
  });

  const setNodeRef = useCallback(
    (node) => {
      setDropRef(node);
      if (!isOverlay) setDragRef(node);
    },
    [setDropRef, setDragRef, isOverlay]
  );

  const handleClick = (event) => {
    if (isOverlay || isDragging || suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;
      return;
    }
    if (onOpen) onOpen(task);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (onOpen) onOpen(task);
    }
  };

  const dragProps = isOverlay || !canDrag ? {} : listeners;

  return (
    <article
      ref={setNodeRef}
      className={`group rounded-xl border bg-white dark:bg-slate-800 p-3 shadow-sm transition-shadow touch-none ${
        isDragging ? 'opacity-30 shadow-none' : 'hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
      } ${overdue ? 'border-rose-200 dark:border-rose-900/60' : 'border-slate-200 dark:border-slate-700/80'} ${
        isOver && !isDragging ? 'ring-2 ring-indigo-200 dark:ring-indigo-500/50' : ''
      } ${isOverlay ? 'shadow-lg ring-2 ring-indigo-200 dark:ring-indigo-500/50 rotate-1 cursor-grabbing' : ''} ${
        canDrag && !isOverlay ? 'cursor-grab' : 'cursor-pointer'
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerUp={() => {
        if (isDragging) suppressClickRef.current = true;
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open task ${task.id}: ${task.title}`}
      {...dragProps}
      {...(isOverlay || !canDrag ? {} : attributes)}
    >
      <div className="flex items-start gap-2">
        {canDrag && (
          <span className="mt-0.5 shrink-0 rounded p-0.5 text-slate-300 dark:text-slate-600" aria-hidden="true">
            <GripVertical className="h-4 w-4" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500">TASK-{task.id}</span>
            <PriorityBadge priority={task.priority} className="shrink-0" />
          </div>
          <h3 className="mt-1 text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100 line-clamp-2">
            {task.title}
          </h3>
          {task.description ? (
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
              {task.description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-700/60 pt-2 text-xs text-slate-600 dark:text-slate-400">
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          <User className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
          <span className="truncate">
            {task.assignee?.name || <span className="italic text-slate-400 dark:text-slate-500">Unassigned</span>}
          </span>
        </span>
        <span
          className={`flex shrink-0 items-center gap-1 ${
            overdue ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {overdue ? (
            <AlertTriangle className="h-3.5 w-3.5" />
          ) : (
            <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          )}
          {formatDueDate(task.due_date)}
        </span>
      </div>
      {overdue && (
        <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">
          Overdue
        </p>
      )}
    </article>
  );
}

export default KanbanTaskCard;
