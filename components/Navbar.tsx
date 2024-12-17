'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import UserMenu from './UserMenu';

export default function Navbar() {
  const { status } = useSession(); // Destructure session and status

  return (
    <>
      {/* Top Navbar */}
      <nav className="flex justify-between items-center px-4 sm:px-8 h-full w-full">
        {/* Left Section: Logo and Links */}
        <div className="flex items-center gap-8 flex-grow">
          <Link
            className="text-2xl"
            href={status === 'authenticated' ? '/library' : '/'}
          >
            <Image
              width={48}
              height={48}
              src="/default-thumbnail.png"
              alt="logo"
              className="rounded-2xl w-8 h-8 sm:w-12 sm:h-12 object-cover"
            />
          </Link>
          {/* Links */}
          <ul className="hidden sm:flex items-center gap-8">
            {status === 'authenticated' && (
              <>
                <li>
                  <Link href="/library" className="hover:underline">
                    Library
                  </Link>
                </li>
                <li>
                  <Link href="/upload" className="hover:underline">
                    Upload
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Right Section: UserMenu */}
        <div className="flex items-center">
          <UserMenu />
        </div>
      </nav>
    </>
  );
}
