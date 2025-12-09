'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import UserMenu from './UserMenu';

export default function Navbar() {
  const { status } = useSession(); // Destructure session and status

  return (
    <nav className="w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-full flex items-center justify-between gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            className="flex items-center gap-3"
            href={status === 'authenticated' ? '/library' : '/'}
          >
            <div className="p-[2px] rounded-2xl bg-gradient-to-br from-pastelPurple to-accentLight">
              <Image
                width={48}
                height={48}
                src="/default-thumbnail.png"
                alt="logo"
                className="rounded-xl w-9 h-9 sm:w-12 sm:h-12 object-cover bg-surface"
              />
            </div>
            <div className="hidden sm:flex flex-col justify-center leading-tight">
              <span className="text-[12px] uppercase tracking-[0.2em] text-muted leading-[1.2]">
                Streamstress
              </span>
              <span className="text-base font-semibold text-textLight dark:text-white leading-[1.2]">
                Your cloud music hub
              </span>
            </div>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
