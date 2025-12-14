'use client';

import { useEffect } from 'react';
import { LibraryTrack } from '@app-types/libraryTrack';

type HydrationParams = {
  setQueue: (tracks: LibraryTrack[]) => void;
  setTrack: (track: LibraryTrack | null) => void;
  setCurrentTrackIndex: (index: number) => void;
  setCurrentTime: (value: number) => void;
  setIsPlaying: (value: boolean) => void;
  setVolume: (value: number) => void;
  setIsShuffle: (value: boolean) => void;
  setRepeatMode: (mode: 'off' | 'queue' | 'track') => void;
};

export function usePlaybackHydration({
  setQueue,
  setTrack,
  setCurrentTrackIndex,
  setCurrentTime,
  setIsPlaying,
  setVolume,
  setIsShuffle,
  setRepeatMode,
}: HydrationParams) {
  useEffect(() => {
    const fetchPlayback = async () => {
      try {
        const res = await fetch('/api/playback');
        if (!res.ok) return;
        const data = await res.json();
        if (!data.track && !data.trackId) return;

        const restoredQueue: LibraryTrack[] = (data.queue || []).map(
          (item: LibraryTrack) => ({
            ...item,
            kind: item.kind === 'featured' ? 'featured' : 'user',
          }),
        );
        setQueue(restoredQueue);
        const fallbackTrack =
          restoredQueue[data.currentTrackIndex] || data.track || null;

        const normalizedFallback: LibraryTrack | null = fallbackTrack
          ? {
              ...(fallbackTrack as LibraryTrack),
              kind:
                (fallbackTrack as LibraryTrack).kind === 'featured'
                  ? 'featured'
                  : 'user',
            }
          : null;

        setTrack(normalizedFallback);
        setCurrentTrackIndex(data.currentTrackIndex || 0);
        setCurrentTime(data.position || 0);
        setIsPlaying(Boolean(data.isPlaying));
        setVolume(typeof data.volume === 'number' ? data.volume : 1);
        setIsShuffle(Boolean(data.isShuffle));
        setRepeatMode(
          data.repeatMode === 'queue' || data.repeatMode === 'track'
            ? data.repeatMode
            : 'off',
        );
      } catch {
        // Ignore hydrate failures to keep the player usable.
      }
    };

    fetchPlayback();
  }, [
    setCurrentTime,
    setCurrentTrackIndex,
    setIsPlaying,
    setIsShuffle,
    setQueue,
    setRepeatMode,
    setTrack,
    setVolume,
  ]);
}
