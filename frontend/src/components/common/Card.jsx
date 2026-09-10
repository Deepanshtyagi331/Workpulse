import React from 'react';

export function Card({
  children,
  className = '',
  title,
  subtitle,
  action,
  headerBorder = false,
  footer,
  ...props
}) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-slate-900 transition-all ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div
          className={`flex items-center justify-between mb-4 ${
            headerBorder ? 'pb-3 border-b border-slate-100' : ''
          }`}
        >
          <div>
            {title && (
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h3>
            )}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
      {footer && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
}

export default Card;

