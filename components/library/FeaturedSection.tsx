'use client';

import React from 'react';
import { LibraryTrack } from '@app-types/libraryTrack';
import TrackListView from '@components/tracks/TrackListView';

type FeaturedSectionProps = {
  tracks: LibraryTrack[];
  error: string | null;
  onSelect: (track: LibraryTrack) => void;
  onAddToQueue: (track: LibraryTrack) => void;
  onPlayNext: (track: LibraryTrack) => void;
  onAddToPlaylist: (track: LibraryTrack) => void;
};

export default function FeaturedSection({
  tracks,
  error,
  onSelect,
  onAddToQueue,
  onPlayNext,
  onAddToPlaylist,
}: FeaturedSectionProps) {
  if (!tracks.length && !error) return null;

  return (
    <>
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm shadow-soft">
          {error}
        </div>
      )}

      {tracks.length > 0 && (
        <section className="mb-8 rounded-2xl border border-borderLight dark:border-borderDark bg-panelLightAlt/70 dark:bg-panelDark/70 p-4 sm:p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Featured
              </p>
              <h2 className="text-lg font-semibold">Always-available tracks</h2>
              <p className="text-sm text-muted">
                Curated tracks available to everyone.
              </p>
            </div>
            <span className="text-xs text-muted">{tracks.length} tracks</span>
          </div>
          <div className="max-h-64 overflow-y-auto sm:max-h-72 scrollbar-soft">
            <TrackListView
              tracks={tracks}
              onSelect={onSelect}
              onDelete={() => {}}
              onAddToQueue={onAddToQueue}
              onPlayNext={onPlayNext}
              onAddToPlaylist={onAddToPlaylist}
            />
          </div>
        </section>
      )}
    </>
  );
}
