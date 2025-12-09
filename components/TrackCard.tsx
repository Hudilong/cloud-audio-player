'use client';

import React from 'react';
import Image from 'next/image';
import { Track } from '@prisma/client';
import { formatTime } from '../utils/formatTime';
import ContextualMenu from './ContextualMenu';
import { Item } from '../types/item';

interface TrackCardProps {
  track: Track;
  onSelect: (track: Track) => void;
  onDelete: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onPlayNext: (track: Track) => void;
  onAddToPlaylist: (track: Track) => void;
}

export default function TrackCard({
  track,
  onSelect,
  onDelete,
  onAddToQueue,
  onPlayNext,
  onAddToPlaylist,
}: TrackCardProps) {
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
    <div className="audio-item bg-white dark:bg-gray-800 rounded-lg shadow-soft  w-full sm:w-40 md:w-44 lg:w-48 flex-shrink-0">
      <div
        className="relative group cursor-pointer"
        role="button"
        tabIndex={0}
        onClick={() => onSelect(track)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onSelect(track);
          }
        }}
      >
        <Image
          width={176}
          height={176}
          src={track.imageURL || '/default-thumbnail.png'}
          alt={track.title || 'thumbnail'}
          className="w-full h-44 object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="white"
            className="play-icon"
          >
            <polygon points="5,3 19,12 5,21" />
          </svg>
        </div>
      </div>
      <div className="px-4 py-2 flex flex-row justify-between items-center">
        <div className="overflow-hidden">
          <h3 className="text-sm font-semibold truncate">{track.title}</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {track.artist}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {formatTime(track.duration)}
          </p>
        </div>

        <ContextualMenu items={menuItems} />
      </div>
    </div>
  );
}
