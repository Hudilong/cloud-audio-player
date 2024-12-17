'use client';

import React from 'react';
import Link from 'next/link';

export default function MobileTabs() {
  return (
    <div className="sm:hidden fixed top-12 w-full flex justify-around items-center bg-gray-900 text-gray-100 shadow-lg py-3 rounded-t-lg">
      <Link
        href="/library"
        className="flex-1 text-center text-sm font-medium hover:text-accentDark transition-colors duration-200"
      >
        Library
      </Link>
      <Link
        href="/upload"
        className="flex-1 text-center text-sm font-medium hover:text-accentDark transition-colors duration-200"
      >
        Upload
      </Link>
    </div>
  );
}
