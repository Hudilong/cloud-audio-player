'use client';

/* eslint-disable react/jsx-props-no-spreading */

import React, { CSSProperties, HTMLAttributes, useContext } from 'react';
import { FiPause, FiPlay, FiMenu } from 'react-icons/fi';
import { PlayerContext } from '@/context/PlayerContext';
import { Item } from '@app-types/item';
import { formatTime } from '@utils/formatTime';
import { TrackWithCover } from '@app-types/trackWithCover';
import CoverImage from '@components/ui/CoverImage';
import { Track } from '@prisma/client';
import ContextualMenu from './ContextualMenu';

interface TrackItemProps {
  track: TrackWithCover;
  onSelect: (track: Track) => void;
  onDelete: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onPlayNext: (track: Track) => void;
  onAddToPlaylist: (track: Track) => void;
  onEdit?: (track: Track) => void;
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
  setNodeRef?: (element: HTMLLIElement | null) => void;
  style?: CSSProperties;
  isDragging?: boolean;
}

export default function TrackItem({
  track,
  onSelect,
  onDelete,
  onAddToQueue,
  onPlayNext,
  onAddToPlaylist,
  onEdit,
  dragHandleProps,
  setNodeRef,
  style,
  isDragging = false,
}: TrackItemProps) {
  const player = useContext(PlayerContext);
  const isCurrentTrack = player?.track?.id === track.id;
  const isPlayingCurrent = isCurrentTrack && player?.isPlaying;

  // Define menu items
  const menuItems: Item[] = [
    ...(onEdit
      ? [
          {
            label: 'Edit track',
            onClick: () => onEdit(track),
          },
        ]
      : []),
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
    <li
      ref={setNodeRef}
      style={style}
      className={`relative flex items-center justify-between gap-3 py-3 px-4 rounded-xl border border-borderLight dark:border-borderDark bg-panelLightAlt dark:bg-panelDark hover:shadow-glass hover:border-accentLight/60 dark:hover:border-accentLight/50 transition-all duration-200 overflow-visible hover:z-40 focus-within:z-40 ${
        isDragging ? 'shadow-glass scale-[1.01]' : ''
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        {dragHandleProps && (
          <button
            type="button"
            {...dragHandleProps}
            className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-panelLight dark:bg-panelDark border border-borderLight dark:border-borderDark text-muted hover:text-ink dark:hover:text-textDark cursor-grab active:cursor-grabbing"
            aria-label="Drag to reorder"
          >
            <FiMenu />
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (isCurrentTrack && player?.togglePlayPause) {
              player.togglePlayPause();
            } else {
              onSelect(track);
            }
          }}
          className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-pastelPurple to-accentLight text-white shadow-soft hover:shadow-glass focus:outline-none flex-shrink-0"
          aria-label={isPlayingCurrent ? 'Pause' : 'Play'}
        >
          {isPlayingCurrent ? <FiPause /> : <FiPlay />}
        </button>
        <CoverImage
          track={track}
          width={48}
          height={48}
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
