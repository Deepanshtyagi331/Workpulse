import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import KanbanTaskCard from './KanbanTaskCard';

export function KanbanColumn({
  column,
  tasks,
  canDragTask,
  onOpenTask,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.key,
    data: {
      type: 'column',
      status: column.key,
    },
  });

  return (
    <section
      className={`flex min-h-[28rem] min-w-[220px] flex-1 flex-col rounded-2xl border ${
        isOver
          ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40'
          : 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60'
      }`}
      aria-label={`${column.label} column`}
    >
      <header className="flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 px-3 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`h-2 w-2 shrink-0 rounded-full ${column.dotClass}`} />
          <h2 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{column.label}</h2>
        </div>
        <span className="rounded-full bg-white dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          {tasks.length}
        </span>
      </header>

      <div ref={setNodeRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-2.5">
        {tasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/40 px-3 py-8 text-center">
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">No tasks</p>
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanTaskCard
              key={task.id}
              task={task}
              canDrag={canDragTask(task)}
              onOpen={onOpenTask}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default KanbanColumn;
