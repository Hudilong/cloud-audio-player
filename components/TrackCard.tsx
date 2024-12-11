import React from 'react';
import Image from 'next/image';
import { Track } from '@prisma/client';
import { formatTime } from '../utils/formatTime';

interface TrackCardProps {
  track: Track;
  onSelect: (track: Track) => void;
}

export default function TrackCard({ track, onSelect }: TrackCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="audio-item bg-white dark:bg-gray-800 rounded-lg shadow-soft overflow-hidden w-full sm:w-40 md:w-44 lg:w-48 flex-shrink-0"
      onClick={() => onSelect(track)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(track);
        }
      }}
    >
      <div className="relative group cursor-pointer">
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
      <div className="p-2">
        <h3 className="text-sm font-semibold truncate">{track.title}</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
          {track.artist}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {formatTime(track.duration)}
        </p>
      </div>
    </div>
  );
}
