'use client';

import React, { RefObject } from 'react';
import { LibraryTrack } from '@app-types/libraryTrack';
import TrackListView from '@components/tracks/TrackListView';
import EmptyState from '@components/library/EmptyState';

type TracksSectionProps = {
  viewMode: 'songs' | 'playlists';
  activePlaylistFilter: { id: string | null; name: string };
  displayedTracks: LibraryTrack[];
  initialLoading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadMoreRef: RefObject<HTMLDivElement>;
  emptyMessage: string;
  onSelect: (track: LibraryTrack) => void;
  onDelete: (track: LibraryTrack) => void;
  onAddToQueue: (track: LibraryTrack) => void;
  onPlayNext: (track: LibraryTrack) => void;
  onAddToPlaylist: (track: LibraryTrack) => void;
  onRemoveFromPlaylist?: (track: LibraryTrack) => void;
  reorderable: boolean;
  onReorder?: (tracks: LibraryTrack[]) => void;
  onEdit: (track: LibraryTrack) => void;
  onAddToFeatured?: (track: LibraryTrack) => void;
  featuringTrackId?: string | null;
  isAdmin?: boolean;
  currentUserId?: string | null;
};

export default function TracksSection({
  viewMode,
  activePlaylistFilter,
  displayedTracks,
  initialLoading,
  loadingMore,
  hasMore,
  loadMoreRef,
  emptyMessage,
  onSelect,
  onDelete,
  onAddToQueue,
  onPlayNext,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  reorderable,
  onReorder,
  onEdit,
  onAddToFeatured,
  featuringTrackId,
  isAdmin,
  currentUserId,
}: TracksSectionProps) {
  if (!(viewMode === 'songs' || activePlaylistFilter.id)) {
    return null;
  }

  if (initialLoading) {
    return (
      <div className="py-4 space-y-3">
        <div className="h-4 w-28 rounded-full bg-surfaceMuted/60 dark:bg-backgroundDark/60 animate-pulse" />
        <div className="space-y-3">
          {[...Array(4)].map((_, idx) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={idx}
              className="flex items-center gap-3 p-3 rounded-xl border border-borderLight dark:border-borderDark bg-panelLightAlt/70 dark:bg-panelDark/70 animate-pulse"
            >
              <div className="h-10 w-10 rounded-full bg-surfaceMuted dark:bg-backgroundDark/70" />
              <div className="h-12 w-12 rounded-xl bg-surfaceMuted dark:bg-backgroundDark/70" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded-full bg-surfaceMuted/80 dark:bg-backgroundDark/70" />
                <div className="h-3 w-24 rounded-full bg-surfaceMuted/60 dark:bg-backgroundDark/60" />
              </div>
              <div className="h-3 w-12 rounded-full bg-surfaceMuted/70 dark:bg-backgroundDark/70" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (displayedTracks.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  let loadMoreText = 'End of library';
  if (loadingMore) {
    loadMoreText = 'Loading more...';
  } else if (hasMore) {
    loadMoreText = 'Scroll to load more';
  }

  return (
    <section className="space-y-3">
      {viewMode === 'songs' && !activePlaylistFilter.id && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Library
            </p>
            <h2 className="text-lg font-semibold">Your uploads</h2>
          </div>
          <span className="text-xs text-muted">
            {displayedTracks.length} tracks
          </span>
        </div>
      )}
      <TrackListView
        tracks={displayedTracks}
        onSelect={onSelect}
        onDelete={onDelete}
        onAddToQueue={onAddToQueue}
        onPlayNext={onPlayNext}
        onAddToPlaylist={onAddToPlaylist}
        onRemoveFromPlaylist={onRemoveFromPlaylist}
        reorderable={reorderable}
        onReorder={onReorder}
        onEdit={onEdit}
        onAddToFeatured={onAddToFeatured}
        featuringTrackId={featuringTrackId}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
      />
      {viewMode === 'songs' && !activePlaylistFilter.id && (
        <div
          ref={loadMoreRef}
          className="flex items-center justify-center py-3 text-xs text-muted"
        >
          {loadMoreText}
        </div>
      )}
    </section>
  );
}
