import React from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Item } from '../types/item';

interface ContextualMenuProps {
  items: Item[];
}

export default function ContextualMenu({ items }: ContextualMenuProps) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </MenuButton>
      <MenuItems className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 shadow-lg rounded-md ring-1 ring-black ring-opacity-5 focus:outline-none z-100">
        {items.map((item, index) => (
          <MenuItem
            key={index /* eslint-disable-line react/no-array-index-key */}
          >
            {({ focus }) => (
              <button
                type="button"
                className={`${focus ? 'bg-gray-100 dark:bg-gray-700' : ''} ${
                  item.disabled
                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-300'
                } block w-full px-4 py-2 text-sm text-left`}
                onClick={item.disabled ? undefined : item.onClick}
                disabled={item.disabled}
              >
                {item.label}
              </button>
            )}
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}
