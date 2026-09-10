import React from 'react';
import { Radio } from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';

export function ConnectionIndicator({ className = '' }) {
  const { status, isConnected } = useWebSocket();

  const config = {
    connected: {
      text: 'Live',
      label: 'Live — Real-time updates connected',
      dotClass: 'bg-emerald-500 shadow-emerald-500/50',
      pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    },
    connecting: {
      text: 'Connecting…',
      label: 'Connecting to real-time update service',
      dotClass: 'bg-amber-500 shadow-amber-500/50 animate-pulse',
      pillClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    },
    offline: {
      text: 'Offline',
      label: 'Offline — Real-time updates unavailable',
      dotClass: 'bg-slate-400 dark:bg-slate-500',
      pillClass: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    },
  }[status] || {
    text: 'Offline',
    label: 'Offline — Real-time updates unavailable',
    dotClass: 'bg-slate-400 dark:bg-slate-500',
    pillClass: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  };

  return (
    <div
      id="connection-indicator"
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors select-none ${config.pillClass} ${className}`}
      role="status"
      aria-label={config.label}
      title={config.label}
    >
      <span className="relative flex h-2 w-2">
        {status === 'connected' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 shadow-sm ${config.dotClass}`} />
      </span>
      <span className="hidden sm:inline font-semibold tracking-tight">{config.text}</span>
    </div>
  );
}

export default ConnectionIndicator;
