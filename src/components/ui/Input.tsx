import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  /** Elemento a la derecha del label (por ejemplo un enlace "¿Olvidaste tu contraseña?") */
  labelAction?: React.ReactNode;
}

/**
 * Input con label asociado, mensaje de error y estilos unificados.
 * Usa forwardRef para funcionar con `register(...)` de react-hook-form.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, labelAction, id, className = '', ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            {label}
          </label>
          {labelAction}
        </div>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border text-white text-sm placeholder-slate-500
            focus:outline-none focus-visible:ring-2 transition ${
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
Input.displayName = 'Input';
