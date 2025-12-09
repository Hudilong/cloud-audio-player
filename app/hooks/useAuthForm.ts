'use client';

import { FormEvent, useCallback, useState } from 'react';

type Validator<T> = (values: T) => string | null;

interface UseAuthFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void>;
  validate?: Validator<T>;
}

export function useAuthForm<T extends Record<string, string>>({
  initialValues,
  onSubmit,
  validate,
}: UseAuthFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateField = useCallback((field: keyof T, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const validationError = validate?.(values);
      if (validationError) {
        setError(validationError);
        return;
      }

      setSubmitting(true);
      setError('');
      try {
        await onSubmit(values);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [onSubmit, validate, values],
  );

  return {
    values,
    error,
    submitting,
    setError,
    updateField,
    handleSubmit,
  };
}
