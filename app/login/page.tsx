'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';
import { FcGoogle } from 'react-icons/fc';

function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [userInfo, setUserInfo] = useState({ email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await signIn('credentials', {
      redirect: false,
      email: userInfo.email,
      password: userInfo.password,
      callbackUrl,
    });

    if (res?.error) {
      setErrorMsg(res.error);
    } else if (res?.url) {
      router.push(res.url);
    }
  };

  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl });
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-4 top-8 h-56 w-56 bg-pastelPurple/25 blur-3xl" />
        <div className="absolute right-10 bottom-6 h-64 w-64 bg-accentLight/25 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md p-8 space-y-5 bg-white/90 dark:bg-backgroundDark/90 border border-white/60 dark:border-white/10 rounded-2xl shadow-glass backdrop-blur">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Welcome back
          </p>
          <h1 className="text-2xl font-bold text-textLight dark:text-textDark">
            Sign in to Streamstress
          </h1>
        </div>
        {errorMsg && (
          <p className="text-red-500 text-center font-medium">{errorMsg}</p>
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
            Sign In
          </button>
        </form>
        <p className="text-sm text-center text-muted">
          Don&apos;t have an account?{' '}
          <a
            href="/register"
            className="text-accentLight dark:text-accentDark hover:underline font-semibold"
          >
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
