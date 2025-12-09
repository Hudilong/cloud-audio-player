'use client';

import { useRouter } from 'next/navigation';
import AuthShell from '../../components/auth/AuthShell';
import { useAuthForm } from '../hooks/useAuthForm';
import { validateEmail } from '../../utils/validateEmail';

function RegisterPage() {
  const router = useRouter();
  const { values, error, submitting, updateField, handleSubmit } = useAuthForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
    },
    validate: (formValues) => {
      if (!validateEmail(formValues.email)) {
        return 'Please enter a valid email address';
      }
      return null;
    },
    onSubmit: async (userInfo) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userInfo),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (res.ok) {
        router.push('/login');
      } else {
        throw new Error(data.error || 'An error occurred');
      }
    },
  });

  return (
    <AuthShell
      eyebrow="Create account"
      title="Join Streamstress"
      footer={
        <p className="text-sm text-center text-muted">
          Already have an account?{' '}
          <a
            href="/login"
            className="text-accentLight dark:text-accentDark hover:underline font-semibold"
          >
            Sign In
          </a>
        </p>
      }
    >
      {error && (
        <p className="text-red-500 text-center font-medium" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-textLight dark:text-textDark"
          >
            Name
            <input
              id="username"
              type="text"
              value={values.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
              className="w-full px-3 py-3 mt-1 bg-white/80 dark:bg-backgroundDark/70 border border-white/70 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-accentLight/50"
            />
          </label>
        </div>
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
          {submitting ? 'Creating account...' : 'Register'}
        </button>
      </form>
    </AuthShell>
  );
}

export default RegisterPage;
