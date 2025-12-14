'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
// import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import Link from 'next/link';

function UserMenu() {
  const { data: session, status } = useSession();
  // const router = useRouter();

  if (status === 'loading') {
    return <div className="animate-pulse w-8 h-8 bg-gray-300 rounded-full" />;
  }

  if (session && session.user) {
    return (
      <Menu as="div" className="relative inline-block text-left z-[70]">
        {/* User Avatar */}
        <MenuButton className="focus:outline-none flex items-center h-12 sm:h-12">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt="User Avatar"
              width={32}
              height={32}
              className="w-10 h-10 rounded-full object-cover border border-white/70 dark:border-white/10 shadow-soft"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-pastelPurple to-accentLight rounded-full flex items-center justify-center text-white font-semibold shadow-soft">
              {session.user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </MenuButton>

        {/* Dropdown Menu */}
        <MenuItems className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-backgroundDark/95 rounded-2xl shadow-glass border border-white/60 dark:border-white/10 backdrop-blur overflow-hidden focus:outline-none z-[90]">
          <div className="px-4 py-3 border-b border-white/60 dark:border-white/10">
            <p className="text-sm font-semibold text-ink dark:text-textDark truncate">
              {session.user.name || 'User'}
            </p>
            <p className="text-xs text-muted truncate">{session.user.email}</p>
          </div>
          {session.user.role === 'ADMIN' && (
            <MenuItem>
              {({ focus }) => (
                <Link
                  href="/admin/featured"
                  className={`block w-full px-4 py-3 text-sm ${
                    focus
                      ? 'bg-pastelPurple/15 dark:bg-accentDark/15 text-ink dark:text-textDark'
                      : 'text-ink dark:text-textDark'
                  }`}
                >
                  Admin: Featured tracks
                </Link>
              )}
            </MenuItem>
          )}
          <MenuItem>
            {({ focus }) => (
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/login' })}
                className={`${
                  focus
                    ? 'bg-pastelPurple/15 dark:bg-accentDark/15 text-ink dark:text-textDark'
                    : 'text-ink dark:text-textDark'
                } block w-full text-left px-4 py-3 text-sm transition-colors`}
              >
                Sign Out
              </button>
            )}
          </MenuItem>
        </MenuItems>
      </Menu>
    );
  }

  return (
    <button
      type="button"
      onClick={() => signIn()}
      className="px-4 sm:px-5 py-2.5 text-sm sm:text-base text-white bg-gradient-to-r from-pastelPurple to-accentLight rounded-full shadow-soft hover:shadow-glass focus:outline-none h-11 sm:h-12 font-semibold"
    >
      Sign In
    </button>
  );
}

export default UserMenu;
