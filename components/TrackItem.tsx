'use client';

import React from 'react';
import { FaPlay } from 'react-icons/fa';
import { Track } from '@prisma/client';
import ContextualMenu from './ContextualMenu';
import { Item } from '../types/item';

interface TrackItemProps {
  track: Track;
  onSelect: (track: Track) => void;
  onDelete: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onPlayNext: (track: Track) => void;
  onAddToPlaylist: (track: Track) => void;
}

export default function TrackItem({
  track,
  onSelect,
  onDelete,
  onAddToQueue,
  onPlayNext,
  onAddToPlaylist,
}: TrackItemProps) {
  // Define menu items
  const menuItems: Item[] = [
    {
      label: 'Add to Playlist',
      onClick: () => onAddToPlaylist(track),
    },
    {
      label: 'Delete Track',
      onClick: () => onDelete(track),
    },
    {
      label: 'Add to Queue',
      onClick: () => onAddToQueue(track),
    },
    {
      label: 'Play Next',
      onClick: () => onPlayNext(track),
    },
  ];

  return (
    <li className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200">
      {/* Track Info and Play Button */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onSelect(track)}
          className="text-gray-500 hover:text-accentLight dark:hover:text-accentDark focus:outline-none"
          aria-label="Play"
        >
          <FaPlay />
        </button>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
            {track.title}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {track.artist}
          </p>
        </div>
      </div>

      {/* Contextual Menu */}
      <ContextualMenu items={menuItems} />
    </li>
  );
}
