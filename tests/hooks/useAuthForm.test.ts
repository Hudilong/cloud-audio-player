import type React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAuthForm } from '@/hooks/useAuthForm';

describe('useAuthForm', () => {
  const baseValues = { email: '', password: '' };

  it('stops submission when validation fails', async () => {
    const onSubmit = vi.fn();
    const validate = vi.fn().mockReturnValue('Missing email');
    const { result } = renderHook(() =>
      useAuthForm({
        initialValues: baseValues,
        onSubmit,
        validate,
      }),
    );

    const submitEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.FormEvent<HTMLFormElement>;

    await act(async () => {
      await result.current.handleSubmit(submitEvent);
    });

    expect(validate).toHaveBeenCalledWith(baseValues);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Missing email');
    expect(result.current.submitting).toBe(false);
  });

  it('propagates submission errors', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new Error('Invalid credentials'));
    const { result } = renderHook(() =>
      useAuthForm({
        initialValues: baseValues,
        onSubmit,
      }),
    );

    const submitEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.FormEvent<HTMLFormElement>;

    await act(async () => {
      await result.current.handleSubmit(submitEvent);
    });

    expect(onSubmit).toHaveBeenCalled();
    expect(result.current.error).toBe('Invalid credentials');
    expect(result.current.submitting).toBe(false);
  });

  it('updates fields and clears errors after a successful submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAuthForm({
        initialValues: baseValues,
        onSubmit,
      }),
    );

    act(() => {
      result.current.setError('old error');
      result.current.updateField('email', 'user@example.com');
      result.current.updateField('password', 'secret');
    });

    const submitEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.FormEvent<HTMLFormElement>;

    await act(async () => {
      await result.current.handleSubmit(submitEvent);
    });

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret',
    });
    expect(result.current.error).toBe('');
    expect(result.current.submitting).toBe(false);
  });
});
