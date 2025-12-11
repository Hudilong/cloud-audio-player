'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';
import AuthShell from '@components/auth/AuthShell';
import { useAuthForm } from '../hooks/useAuthForm';

function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const { values, error, submitting, setError, updateField, handleSubmit } =
    useAuthForm({
      initialValues: { email: '', password: '' },
      onSubmit: async (credentials) => {
        const res = await signIn('credentials', {
          redirect: false,
          email: credentials.email,
          password: credentials.password,
          callbackUrl,
        });

        if (res?.error) {
          throw new Error(res.error);
        } else if (res?.url) {
          router.push(res.url);
        }
      },
    });

  const handleGoogleSignIn = async () => {
    setError('');
    await signIn('google', { callbackUrl });
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to Streamstress"
      footer={
        <p className="text-sm text-center text-muted">
          Don&apos;t have an account?{' '}
          <a
            href="/register"
            className="text-accentLight dark:text-accentDark hover:underline font-semibold"
          >
            Sign Up
          </a>
        </p>
      }
    >
      {error && (
        <p className="text-red-500 text-center font-medium" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="flex items-center justify-center w-full gap-3 px-4 py-3 text-sm font-semibold text-ink bg-white rounded-xl border border-white/70 shadow-soft hover:shadow-glass transition-colors"
      >
        <FcGoogle size={22} />
        Sign in with Google
      </button>

      <div className="relative flex items-center justify-center">
        <span className="absolute px-2 text-muted bg-white/90 dark:bg-backgroundDark/90">
          OR
        </span>
        <div className="w-full h-px bg-white/70 dark:bg-white/10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-textLight dark:text-textDark"
          >
            Email
            <input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
              className="w-full px-3 py-3 mt-1 bg-white/80 dark:bg-backgroundDark/70 border border-white/70 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-accentLight/50"
            />
          </label>
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-textLight dark:text-textDark"
          >
            Password
            <input
              id="password"
              type="password"
              value={values.password}
              onChange={(e) => updateField('password', e.target.value)}
              required
              className="w-full px-3 py-3 mt-1 bg-white/80 dark:bg-backgroundDark/70 border border-white/70 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-accentLight/50"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-3 text-white bg-gradient-to-r from-pastelPurple to-accentLight rounded-xl shadow-soft hover:shadow-glass font-semibold disabled:opacity-70"
        >
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </AuthShell>
  );
}

export default LoginPage;
