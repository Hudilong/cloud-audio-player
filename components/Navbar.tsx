'use client';

import Link from 'next/link';
import React from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import UserMenu from './UserMenu';

export default function Navbar() {
  const session = useSession();
  return (
    <nav className="flex justify-between items-center px-8 h-full">
      <ul className="flex justify-between items-center gap-8 ">
        <li>
          <Link className="text-2xl" href="/">
            <Image
              width="48"
              height="48"
              src="/default-thumbnail.png"
              alt="logo"
              className="rounded-lg"
            />
          </Link>
        </li>
        {session && session.status === 'authenticated' && (
          <>
            <li>
              <Link href="/library">Library</Link>
            </li>
            <li>
              <Link href="/upload">Upload</Link>
            </li>
          </>
        )}
      </ul>
      <UserMenu />
    </nav>
  );
}
