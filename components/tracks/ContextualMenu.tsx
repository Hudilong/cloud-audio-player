import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Portal,
} from '@headlessui/react';
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
  const estimatedMenuHeight = 220; // enough to decide above/below

  const updateCoords = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldPlaceAbove =
      spaceBelow < estimatedMenuHeight && spaceAbove > estimatedMenuHeight;

    const top = shouldPlaceAbove
      ? Math.max(rect.top - estimatedMenuHeight - 8, 8)
      : rect.bottom + 8;

    const maxLeft = Math.max(viewportWidth - menuWidth - 12, 12);
    const left = Math.min(Math.max(rect.right - menuWidth, 12), maxLeft);
    setCoords((prev) => {
      if (prev && prev.top === top && prev.left === left) return prev;
      return { top, left };
    });
  }, [menuWidth]);

  useEffect(() => {
    const handleResize = () => {
      updateCoords();
    };
    const handleScroll = () => {
      updateCoords();
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [updateCoords]);

  const menuStyle = useMemo(
    () =>
      coords
        ? {
            position: 'fixed' as const,
            top: coords.top,
            left: coords.left,
            width: menuWidth,
          }
        : {
            position: 'fixed' as const,
            top: -9999,
            left: -9999,
            width: menuWidth,
          },
    [coords, menuWidth],
  );

  return (
    <Menu as="div" className="relative inline-block text-left">
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
      <Portal>
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
      </Portal>
    </Menu>
  );
}
