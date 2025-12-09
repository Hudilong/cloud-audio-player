'use client';

import React from 'react';
import { Track } from '@prisma/client';
import TrackItem from './TrackItem';

interface TrackListViewProps {
  tracks: Track[];
  onSelect: (track: Track) => void;
  onDelete: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onPlayNext: (track: Track) => void;
  onAddToPlaylist: (track: Track) => void;
}

export default function TrackListView({
  tracks,
  onSelect,
  onDelete,
  onAddToQueue,
  onPlayNext,
  onAddToPlaylist,
}: TrackListViewProps) {
  return (
    <ul className="w-full divide-y divide-gray-200 dark:divide-gray-700">
      {tracks.map((track) => (
        <TrackItem
          key={track.id}
          track={track}
          onSelect={onSelect}
          onDelete={onDelete}
          onAddToQueue={onAddToQueue}
          onPlayNext={onPlayNext}
          onAddToPlaylist={onAddToPlaylist}
        />
      ))}
    </ul>
  );
}
