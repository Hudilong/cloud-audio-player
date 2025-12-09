'use client';

import React from 'react';
import Image from 'next/image';
import { FiPlay } from 'react-icons/fi';
import { Track } from '@prisma/client';
import ContextualMenu from './ContextualMenu';
import { Item } from '../types/item';
import { formatTime } from '../utils/formatTime';

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
    <li className="relative flex items-center justify-between gap-3 py-3 px-4 rounded-xl border border-white/70 dark:border-white/10 bg-white/70 dark:bg-backgroundDark/70 hover:shadow-glass hover:border-accentLight/40 dark:hover:border-accentLight/30 hover:bg-white dark:hover:bg-backgroundDark/80 transition-all duration-200 overflow-visible hover:z-40 focus-within:z-40">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onSelect(track)}
          className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-pastelPurple to-accentLight text-white shadow-soft hover:shadow-glass focus:outline-none flex-shrink-0"
          aria-label="Play"
        >
          <FiPlay />
        </button>
        <Image
          width={48}
          height={48}
          src={track.imageURL || '/default-thumbnail.png'}
          alt={track.title || 'track art'}
          className="h-12 w-12 rounded-xl object-cover border border-white/70 dark:border-white/10 flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink dark:text-textDark truncate">
            {track.title}
          </p>
          <p className="text-xs text-muted truncate">{track.artist}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-xs text-muted">{formatTime(track.duration)}</div>
        <div className="flex-shrink-0">
          <ContextualMenu items={menuItems} />
        </div>
      </div>
    </li>
  );
}
