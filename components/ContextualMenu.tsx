import React from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Item } from '../types/item';

interface ContextualMenuProps {
  items: Item[];
}

export default function ContextualMenu({ items }: ContextualMenuProps) {
  return (
    <Menu as="div" className="relative inline-block text-left z-[200]">
      <MenuButton className="text-muted hover:text-textLight dark:hover:text-textDark">
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
      <MenuItems className="absolute right-0 mt-2 w-44 bg-white/95 dark:bg-backgroundDark/90 shadow-soft rounded-xl border border-white/60 dark:border-white/10 backdrop-blur focus:outline-none z-[240] overflow-hidden">
        {items.map((item, index) => (
          <MenuItem
            key={index /* eslint-disable-line react/no-array-index-key */}
          >
            {({ focus }) => (
              <button
                type="button"
                className={`${focus ? 'bg-pastelPurple/15 dark:bg-accentDark/15 text-ink dark:text-textDark' : ''} ${
                  item.disabled
                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'text-ink dark:text-textDark'
                } block w-full px-4 py-2.5 text-sm text-left transition-colors`}
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
