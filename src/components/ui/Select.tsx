import React, { useId } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, id, className = '', children, ...props }, ref) => {
    const autoId = useId();
    const selectId = id ?? autoId;

    return (
      <div>
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${selectId}-error` : undefined}
          className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border text-white text-sm
            focus:outline-none focus-visible:ring-2 transition ${
              error
                ? 'border-red-500 focus-visible:ring-red-500/30'
                : 'border-slate-700 focus:border-emerald-500 focus-visible:ring-emerald-500/30'
            } ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && (
          <span id={`${selectId}-error`} role="alert" className="text-red-400 text-xs mt-1 block">
            {error}
          </span>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
