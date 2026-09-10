import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '../common/Button';

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this data. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 shadow-sm ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-3.5 shadow-inner">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-rose-200 tracking-tight">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mt-1 leading-relaxed">{message}</p>
      {onRetry && (
        <div className="mt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            icon={RefreshCw}
            className="border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100/60 dark:hover:bg-rose-900/30"
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export default ErrorState;
