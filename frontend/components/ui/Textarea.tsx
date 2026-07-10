'use client';

import { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', id, ...props }: TextareaProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`w-full rounded-xl border bg-[var(--bg-tertiary)] px-4 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-200 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-[var(--bg-elevated)] resize-y min-h-[80px] ${
          error ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' : 'border-[var(--border-default)]'
        } ${className}`}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-[12px] text-red-400">{error}</p>
      )}
    </div>
  );
}
