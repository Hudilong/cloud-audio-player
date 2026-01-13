import React from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

type AlertBannerProps = {
  message?: React.ReactNode;
  variant?: AlertVariant;
  onDismiss?: () => void;
  className?: string;
};

export default function AlertBanner({
  message,
  variant = 'info',
  onDismiss,
  className,
}: AlertBannerProps) {
  if (!message) return null;

  const variantClasses: Record<AlertVariant, string> = {
    info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-100',
    success:
      'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100',
    warning:
      'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100',
    error:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-100',
  };

  const role = variant === 'error' ? 'alert' : 'status';

  return (
    <div
      role={role}
      className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-soft ${variantClasses[variant]} ${
        className || ''
      }`}
    >
      <div className="flex-1">{message}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-semibold text-current hover:opacity-80"
          aria-label="Dismiss alert"
        >
          x
        </button>
      )}
    </div>
  );
}
