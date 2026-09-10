import React from 'react';
import { Loader2 } from 'lucide-react';

const SIZES = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
};

export function LoadingSpinner({
  size = 'md',
  label = 'Loading...',
  fullPage = false,
  className = '',
}) {
  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 p-6 text-slate-500 ${className}`}>
      <Loader2 className={`${SIZES[size]} animate-spin text-indigo-600`} />
      {label && <p className="text-xs font-medium tracking-wide uppercase text-slate-500">{label}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}

export default LoadingSpinner;
