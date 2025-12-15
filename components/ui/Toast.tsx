import React from 'react';

export type ToastVariant = 'info' | 'success' | 'error' | 'warning';

export type ToastMessage = {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastProps = ToastMessage & {
  onDismiss: (id: string) => void;
};

export function Toast({
  id,
  title,
  description,
  variant = 'info',
  onDismiss,
}: ToastProps) {
  const variantClasses: Record<ToastVariant, string> = {
    info: 'border-blue-200 text-blue-900 dark:border-blue-500/40 dark:text-blue-100',
    success:
      'border-emerald-200 text-emerald-900 dark:border-emerald-500/40 dark:text-emerald-100',
    warning:
      'border-amber-200 text-amber-900 dark:border-amber-500/40 dark:text-amber-100',
    error:
      'border-red-200 text-red-900 dark:border-red-500/40 dark:text-red-100',
  };

  const baseClasses =
    'w-full max-w-sm rounded-2xl shadow-glass border px-4 py-3 space-y-1 backdrop-blur bg-white/90 dark:bg-backgroundDark/90 transition-all';

  return (
    <div className={`${baseClasses} ${variantClasses[variant]}`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-sm font-semibold truncate" title={title}>
              {title}
            </p>
          )}
          {description && (
            <p className="text-sm text-muted leading-snug" title={description}>
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          className="text-xs text-muted hover:text-ink dark:hover:text-white"
          onClick={() => onDismiss(id)}
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
