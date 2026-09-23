import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        {label && (
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-3.5 py-2 text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 border rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:bg-zinc-50 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed ${
            error ? 'border-rose-400 dark:border-rose-500/60 focus:ring-rose-400' : 'border-zinc-200 dark:border-zinc-700'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';