import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { usePlaybackHydration } from '@/hooks/usePlaybackHydration';
import { LibraryTrack } from '@app-types/libraryTrack';
import React from 'react';

const buildTrack = (id: string): LibraryTrack => ({
  id,
  title: `Track ${id}`,
  artist: 'Artist',
  album: 'Album',
  genre: 'Genre',
  duration: 200,
  s3Key: `s3-${id}`,
  imageURL: null,
  imageBlurhash: null,
  userId: 'user-1',
  isFeatured: false,
  kind: 'user',
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('usePlaybackHydration', () => {
  it('hydrates playback state from the API response', async () => {
    const queue = [buildTrack('one'), buildTrack('two')];
    const response = {
      queue,
      track: queue[1],
      currentTrackIndex: 1,
      position: 42,
      isPlaying: true,
      volume: 0.5,
      isShuffle: true,
      repeatMode: 'queue' as const,
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => response,
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => {
      const [state, setState] = React.useState({
        queue: [] as LibraryTrack[],
        track: null as LibraryTrack | null,
        currentTrackIndex: 0,
        currentTime: 0,
        isPlaying: false,
        volume: 1,
        isShuffle: false,
        repeatMode: 'off' as const,
      });

      usePlaybackHydration({
        setQueue: (q) => setState((prev) => ({ ...prev, queue: q })),
        setTrack: (t) => setState((prev) => ({ ...prev, track: t })),
        setCurrentTrackIndex: (i) =>
          setState((prev) => ({ ...prev, currentTrackIndex: i })),
        setCurrentTime: (t) =>
          setState((prev) => ({ ...prev, currentTime: t })),
        setIsPlaying: (p) => setState((prev) => ({ ...prev, isPlaying: p })),
        setVolume: (v) => setState((prev) => ({ ...prev, volume: v })),
        setIsShuffle: (s) => setState((prev) => ({ ...prev, isShuffle: s })),
        setRepeatMode: (mode) =>
          setState((prev) => ({ ...prev, repeatMode: mode })),
      });

      return state;
    });

    await waitFor(() => expect(result.current.queue).toHaveLength(2));

    expect(fetchMock).toHaveBeenCalledWith('/api/playback');
    expect(result.current.currentTrackIndex).toBe(1);
    expect(result.current.track?.id).toBe('two');
    expect(result.current.currentTime).toBe(42);
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.volume).toBe(0.5);
    expect(result.current.isShuffle).toBe(true);
    expect(result.current.repeatMode).toBe('queue');
  });
});
