'use client';

import React from 'react';
import Link from 'next/link';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorPageProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-backgroundLight to-surfaceMuted dark:from-backgroundDark dark:to-[#0B1021] text-textLight dark:text-textDark flex items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-3xl border border-borderLight dark:border-borderDark bg-white/80 dark:bg-backgroundDark/90 shadow-glass backdrop-blur-xl p-6 sm:p-8 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Something went wrong
            </p>
            <h1 className="text-2xl font-bold">
              We hit a snag loading this page.
            </h1>
            <p className="text-sm text-muted leading-relaxed">
              {error.message ||
                'An unexpected error occurred. Please try again.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pastelPurple to-accentLight text-white font-semibold shadow-soft hover:shadow-glass"
            >
              Try again
            </button>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl border border-borderLight dark:border-borderDark text-sm font-semibold text-ink dark:text-textDark hover:bg-white/60 dark:hover:bg-white/5"
            >
              Go home
            </Link>
          </div>
          {error.digest && (
            <p className="text-[11px] text-muted">
              Error ID: <code className="text-xs">{error.digest}</code>
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
