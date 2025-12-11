import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Item } from '@app-types/item';

interface ContextualMenuProps {
  items: Item[];
}

export default function ContextualMenu({ items }: ContextualMenuProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const menuWidth = 176; // tailwind w-44

  const updateCoords = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const top = rect.bottom + 8;
    const left = rect.right - menuWidth;
    setCoords({ top, left: Math.max(left, 8) });
  };

  useEffect(() => {
    const handleResize = () => {
      if (coords) updateCoords();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [coords]);

  const menuStyle = useMemo(
    () =>
      coords
        ? {
            position: 'fixed' as const,
            top: coords.top,
            left: coords.left,
            width: menuWidth,
          }
        : undefined,
    [coords],
  );

  return (
    <Menu as="div" className="relative inline-block text-left z-20">
      <MenuButton
        ref={buttonRef}
        className="text-muted hover:text-textLight dark:hover:text-textDark"
        onClick={updateCoords}
      >
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
      <MenuItems
        className="fixed z-[60] mt-2 w-44 bg-white/95 dark:bg-backgroundDark/90 shadow-soft rounded-xl border border-white/60 dark:border-white/10 backdrop-blur focus:outline-none overflow-hidden"
        style={menuStyle}
      >
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
