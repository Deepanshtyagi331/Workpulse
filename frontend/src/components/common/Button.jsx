import React from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm border-transparent focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1',
  secondary: 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1',
  outline: 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm border-transparent focus:ring-2 focus:ring-rose-500 focus:ring-offset-1',
  ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-transparent',
};

const SIZES = {
  sm: 'px-2.5 py-1.5 text-xs font-medium rounded-lg gap-1.5',
  md: 'px-3.5 py-2 text-sm font-medium rounded-lg gap-2',
  lg: 'px-4.5 py-2.5 text-base font-medium rounded-lg gap-2.5',
};


export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  icon: Icon,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium border transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
}

export default Button;
