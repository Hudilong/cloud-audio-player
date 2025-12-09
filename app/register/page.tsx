'use client';

import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';
import { validateEmail } from '../../utils/validateEmail';

function RegisterPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    if (!validateEmail(userInfo.email)) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    e.preventDefault();
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userInfo),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (res.ok) {
      router.push('/login');
    } else {
      setErrorMsg(data.error || 'An error occurred');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-6 top-8 h-56 w-56 bg-pastelPurple/25 blur-3xl" />
        <div className="absolute right-12 bottom-6 h-64 w-64 bg-accentLight/25 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md p-8 space-y-5 bg-white/90 dark:bg-backgroundDark/90 border border-white/60 dark:border-white/10 rounded-2xl shadow-glass backdrop-blur">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Create account
          </p>
          <h1 className="text-2xl font-bold text-textLight dark:text-textDark">
            Join Streamstress
          </h1>
        </div>
        {errorMsg && (
          <p className="text-red-500 text-center font-medium">{errorMsg}</p>
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
                value={userInfo.name}
                onChange={(e) =>
                  setUserInfo({
                    ...userInfo,
                    name: e.target.value,
                  })
                }
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
                value={userInfo.email}
                onChange={(e) =>
                  setUserInfo({
                    ...userInfo,
                    email: e.target.value,
                  })
                }
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
                value={userInfo.password}
                onChange={(e) =>
                  setUserInfo({
                    ...userInfo,
                    password: e.target.value,
                  })
                }
                required
                className="w-full px-3 py-3 mt-1 bg-white/80 dark:bg-backgroundDark/70 border border-white/70 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-accentLight/50"
              />
            </label>
          </div>
          <button
            type="submit"
            className="w-full px-4 py-3 text-white bg-gradient-to-r from-pastelPurple to-accentLight rounded-xl shadow-soft hover:shadow-glass font-semibold"
          >
            Register
          </button>
        </form>
        <p className="text-sm text-center text-muted">
          Already have an account?{' '}
          <a
            href="/login"
            className="text-accentLight dark:text-accentDark hover:underline font-semibold"
          >
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
