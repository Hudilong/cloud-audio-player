import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Track } from '@prisma/client';
import { debounce } from '@utils/debounce';

type RepeatMode = 'off' | 'queue' | 'track';

type Snapshot = {
  track: Track | null;
  currentTime: number;
  isPlaying: boolean;
  queue: Track[];
  currentTrackIndex: number;
  volume: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
};

export function usePlaybackSaver(snapshot: Snapshot) {
  const snapshotRef = useRef<Snapshot>(snapshot);
  const isDirtyRef = useRef(false);

  const {
    track,
    currentTime,
    isPlaying,
    queue,
    currentTrackIndex,
    volume,
    isShuffle,
    repeatMode,
  } = snapshot;

  useEffect(() => {
    snapshotRef.current = {
      track,
      currentTime,
      isPlaying,
      queue,
      currentTrackIndex,
      volume,
      isShuffle,
      repeatMode,
    };
    isDirtyRef.current = true;
  }, [
    track,
    currentTime,
    isPlaying,
    queue,
    currentTrackIndex,
    volume,
    isShuffle,
    repeatMode,
  ]);

  const persist = useCallback(async () => {
    const { current } = snapshotRef;
    if (!current.track) return;
    if (!isDirtyRef.current) return;

    try {
      await fetch('/api/playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: current.track.id,
          position: current.currentTime,
          isPlaying: current.isPlaying,
          volume: current.volume,
          isShuffle: current.isShuffle,
          repeatMode: current.repeatMode,
          currentTrackIndex: current.currentTrackIndex,
          queueTrackIds: current.queue.map((item) => item.id),
        }),
      });
      isDirtyRef.current = false;
    } catch {
      // best-effort persistence; ignore errors
    }
  }, []);

  const debouncedPersist = useMemo(() => debounce(persist, 400), [persist]);

  useEffect(() => {
    if (!snapshot.isPlaying) {
      return () => {};
    }

    const interval = window.setInterval(() => {
      persist();
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [persist, snapshot.isPlaying]);

  return { persist, debouncedPersist };
}
