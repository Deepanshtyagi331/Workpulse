import React from 'react';
import { Activity } from 'lucide-react';

const TONES = {
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-100 dark:border-indigo-900/40',
    hover: 'hover:border-indigo-200 dark:hover:border-indigo-800/60',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-100 dark:border-amber-900/40',
    hover: 'hover:border-amber-200 dark:hover:border-amber-800/60',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-100 dark:border-blue-900/40',
    hover: 'hover:border-blue-200 dark:hover:border-blue-800/60',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-100 dark:border-emerald-900/40',
    hover: 'hover:border-emerald-200 dark:hover:border-emerald-800/60',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-100 dark:border-rose-900/40',
    hover: 'hover:border-rose-200 dark:hover:border-rose-800/60',
  },
  slate: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
    hover: 'hover:border-slate-300 dark:hover:border-slate-600',
  },
};

export function StatCard({
  title,
  value,
  description,
  change,
  isPositive = true,
  icon: Icon = Activity,
  tone = 'indigo',
  onClick,
  className = '',
}) {
  const toneConfig = TONES[tone] || TONES.indigo;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm transition-all duration-150 ${
        toneConfig.hover
      } ${onClick ? 'cursor-pointer hover:shadow' : ''} ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg border ${toneConfig.bg} ${toneConfig.text} ${toneConfig.border}`}
        >
          <Icon className="h-4 w-4 stroke-[2.2]" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value ?? 0}</span>
      </div>

      {(description || change) && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
          {change ? (
            <span
              className={`font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
            >
              {change}
            </span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">{description}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default StatCard;
