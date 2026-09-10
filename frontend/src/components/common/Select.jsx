import React from 'react';

export function Select({
  label,
  error,
  helperText,
  id,
  name,
  options = [],
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = 'Select an option',
  className = '',
  ...props
}) {
  const selectId = id || name || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative rounded-lg shadow-sm">
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`block w-full rounded-lg border bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-500 dark:disabled:text-slate-500 ${
            error
              ? 'border-rose-300 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-300 dark:border-slate-600'
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-slate-400 dark:text-slate-500">
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const text = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={val} value={val} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                {text}
              </option>
            );
          })}
        </select>
      </div>

      {error ? (
        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
}

export default Select;
