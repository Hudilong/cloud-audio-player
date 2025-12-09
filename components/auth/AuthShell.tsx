import { ReactNode } from 'react';

interface AuthShellProps {
  title: string;
  eyebrow: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export default function AuthShell({
  title,
  eyebrow,
  description,
  footer,
  children,
}: AuthShellProps) {
  return (
    <div className="relative overflow-hidden px-4 py-14 sm:py-18 flex items-center justify-center min-h-[calc(100vh-9rem)]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-6 top-8 h-56 w-56 bg-pastelPurple/25 blur-3xl" />
        <div className="absolute right-12 bottom-6 h-64 w-64 bg-accentLight/25 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md p-8 space-y-5 bg-panelLight dark:bg-panelDark border border-borderLight dark:border-borderDark rounded-2xl shadow-glass translate-y-3">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            {eyebrow}
          </p>
          <h1 className="text-2xl font-bold text-textLight dark:text-textDark">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted max-w-sm mx-auto">{description}</p>
          )}
        </div>

        {children}

        {footer}
      </div>
    </div>
  );
}
