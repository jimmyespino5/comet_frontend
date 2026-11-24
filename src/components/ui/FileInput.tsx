import React, { useId } from 'react';

interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

/** Selector de archivo con label asociado. Compatible con `register(...)` de react-hook-form. */
export const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ label, hint, error, id, className = '', ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

    return (
      <div>
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          type="file"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`w-full rounded-xl bg-slate-950 border text-sm text-slate-400 cursor-pointer transition
            file:mr-4 file:py-2.5 file:px-4 file:border-0 file:rounded-xl file:text-sm file:font-semibold
            file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 file:cursor-pointer
            focus:outline-none focus-visible:ring-2 ${
              error
                ? 'border-red-500 focus-visible:ring-red-500/30'
                : 'border-slate-700 focus:border-emerald-500 focus-visible:ring-emerald-500/30'
            } ${className}`}
          {...props}
        />
        {error ? (
          <span id={`${inputId}-error`} role="alert" className="text-red-400 text-xs mt-1 block">
            {error}
          </span>
        ) : hint ? (
          <span id={`${inputId}-hint`} className="text-slate-400 text-xs mt-1 block">
            {hint}
          </span>
        ) : null}
      </div>
    );
  }
);
FileInput.displayName = 'FileInput';
