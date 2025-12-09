'use client';

import React from 'react';
import Link from 'next/link';

export default function MobileTabs() {
  return (
    <div className="sm:hidden fixed top-14 w-full flex justify-around items-center bg-white/90 dark:bg-backgroundDark/90 backdrop-blur-lg text-ink dark:text-textDark shadow-glass py-3 border-b border-white/50 dark:border-white/10 z-30">
      <Link
        href="/library"
        className="flex-1 text-center text-sm font-semibold hover:text-accentDark transition-colors duration-200"
      >
        Library
      </Link>
      <Link
        href="/playlists"
        className="flex-1 text-center text-sm font-semibold hover:text-accentDark transition-colors duration-200"
      >
        Playlists
      </Link>
      <Link
        href="/upload"
        className="flex-1 text-center text-sm font-semibold hover:text-accentDark transition-colors duration-200"
      >
        Upload
      </Link>
    </div>
  );
}
