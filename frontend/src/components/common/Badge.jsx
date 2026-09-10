import React from 'react';

const TONES = {
  indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  slate: 'bg-slate-700/40 text-slate-300 border-slate-700/60',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
};

export function Badge({ children, tone = 'indigo', className = '', dot = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${TONES[tone] || TONES.slate} ${className}`}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {children}
    </span>
  );
}

export default Badge;
