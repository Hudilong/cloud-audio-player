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
    <div className="audio-item bg-white/80 dark:bg-backgroundDark/80 backdrop-blur rounded-2xl border border-white/70 dark:border-white/10 shadow-soft hover:shadow-glass transition-all w-full flex-shrink-0">
      <div
        className="relative group cursor-pointer overflow-hidden rounded-2xl"
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
          className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-ink/70 via-ink/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-ink text-sm font-semibold shadow-soft">
            Play now
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <polygon points="7,4 19,12 7,20" fill="currentColor" />
            </svg>
          </span>
        </div>
      </div>
      <div className="px-4 py-3 flex flex-row justify-between items-start">
        <div className="overflow-hidden space-y-0.5">
          <h3 className="text-sm font-semibold truncate text-ink dark:text-textDark">
            {track.title}
          </h3>
          <p className="text-xs text-muted truncate">{track.artist}</p>
          <p className="text-xs text-muted">{formatTime(track.duration)}</p>
        </div>

        <ContextualMenu items={menuItems} />
      </div>
    </div>
  );
}
