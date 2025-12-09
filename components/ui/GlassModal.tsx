import { ReactNode } from 'react';

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  size?: 'md' | 'lg';
  actions?: ReactNode;
  children: ReactNode;
}

export default function GlassModal({
  isOpen,
  onClose,
  title,
  eyebrow,
  size = 'md',
  actions,
  children,
}: GlassModalProps) {
  if (!isOpen) return null;

  const widthClass = size === 'lg' ? 'max-w-xl' : 'max-w-md';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[180] flex items-center justify-center px-4">
      <div
        className={`relative w-full ${widthClass} bg-panelLight dark:bg-panelDark rounded-2xl border border-borderLight dark:border-borderDark shadow-glass p-6 sm:p-7`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            {eyebrow && (
              <p className="text-xs uppercase tracking-[0.14em] text-muted font-semibold">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="text-xl font-semibold text-ink dark:text-textDark">
                {title}
              </h2>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-full text-sm text-ink dark:text-textDark hover:text-ink dark:hover:text-textDark hover:bg-panelLightAlt dark:hover:bg-panelDarkAlt border border-transparent"
          >
            Close
          </button>
        </div>

        <div className="mt-4">{children}</div>

        {actions && (
          <div className="mt-6 flex justify-end gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
