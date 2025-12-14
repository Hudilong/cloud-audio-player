'use client';

import { useMemo, useState } from 'react';

type ViewMode = 'songs' | 'playlists';

type ActivePlaylist = { id: string | null; name: string };

type UseLibraryViewStateParams = {
  defaultPlaylist: ActivePlaylist;
};

export function useLibraryViewState({
  defaultPlaylist,
}: UseLibraryViewStateParams) {
  const [viewMode, setViewMode] = useState<ViewMode>('songs');
  const [activePlaylistFilter, setActivePlaylistFilter] =
    useState<ActivePlaylist>(defaultPlaylist);

  const emptyMessage = useMemo(
    () =>
      activePlaylistFilter.id
        ? 'No tracks in this playlist yet.'
        : 'No songs yet. Upload your first track to get started.',
    [activePlaylistFilter.id],
  );

  return {
    viewMode,
    setViewMode,
    activePlaylistFilter,
    setActivePlaylistFilter,
    emptyMessage,
  };
}
