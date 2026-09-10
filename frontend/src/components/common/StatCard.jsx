import React from 'react';
import { Activity } from 'lucide-react';

const TONES = {
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    border: 'border-indigo-100',
    hover: 'hover:border-indigo-200',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-100',
    hover: 'hover:border-amber-200',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-100',
    hover: 'hover:border-blue-200',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-100',
    hover: 'hover:border-emerald-200',
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    border: 'border-rose-100',
    hover: 'hover:border-rose-200',
  },
  slate: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    hover: 'hover:border-slate-300',
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
      className={`relative overflow-hidden bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition-all duration-150 ${
        toneConfig.hover
      } ${onClick ? 'cursor-pointer hover:shadow' : ''} ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg border ${toneConfig.bg} ${toneConfig.text} ${toneConfig.border}`}
        >
          <Icon className="h-4 w-4 stroke-[2.2]" />
        </div>
      </div>


      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value ?? 0}</span>
      </div>

      {(description || change) && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
          {change ? (
            <span
              className={`font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}
            >
              {change}
            </span>
          ) : (
            <span className="text-slate-500">{description}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default StatCard;
