"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

const UserMenu = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    if (status === "loading") {
        return (
            <div className="animate-pulse w-8 h-8 bg-gray-300 rounded-full"></div>
        );
    }

    if (session && session.user) {
        return (
            <Menu as="div" className="relative inline-block text-left mt-2">
                <MenuButton className="focus:outline-none">
                    {session.user.image ? (
                        <Image
                            src={session.user.image}
                            alt="User Avatar"
                            width={32}
                            height={32}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white">
                            {session.user.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                    )}
                </MenuButton>
                <MenuItems className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <MenuItem>
                        {({ focus }) => (
                            <button
                                onClick={() => router.push("/settings")}
                                className={`${
                                    focus ? "bg-gray-100 dark:bg-gray-700" : ""
                                } block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                            >
                                Settings
                            </button>
                        )}
                    </MenuItem>
                    <MenuItem>
                        {({ focus }) => (
                            <button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className={`${
                                    focus ? "bg-gray-100 dark:bg-gray-700" : ""
                                } block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                            >
                                Sign Out
                            </button>
                        )}
                    </MenuItem>
                </MenuItems>
            </Menu>
        );
    } else {
        return (
            <button
                onClick={() => signIn()}
                className="px-4 py-2 text-white bg-accentLight dark:bg-accentDark rounded-md hover:bg-opacity-90 focus:outline-none"
            >
                Sign In
            </button>
        );
    }
};

export default UserMenu;
