'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Toast, ToastMessage, ToastVariant } from '@components/ui/Toast';
import { nanoid } from 'nanoid';

type ToastContextValue = {
  notify: (
    message: string,
    options?: { title?: string; variant?: ToastVariant },
  ) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);
const noopToast: ToastContextValue = { notify: () => {} };

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Provide a safe fallback in non-provider contexts (e.g., tests)
    return noopToast;
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (
      description: string,
      options?: { title?: string; variant?: ToastVariant },
    ) => {
      const id = nanoid();
      const toast: ToastMessage = {
        id,
        description,
        title: options?.title,
        variant: options?.variant ?? 'info',
      };
      setToasts((prev) => [...prev, toast]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed z-[60] top-5 right-4 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              id={toast.id}
              title={toast.title}
              description={toast.description}
              variant={toast.variant}
              onDismiss={dismiss}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
