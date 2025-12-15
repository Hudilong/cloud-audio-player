'use client';

import { Dispatch, SetStateAction, useCallback } from 'react';
import { LibraryTrack } from '@app-types/libraryTrack';

type RepeatMode = 'off' | 'queue' | 'track';

type QueueControllerParams = {
  audioRef: React.RefObject<HTMLAudioElement>;
  queue: LibraryTrack[];
  setQueue: Dispatch<SetStateAction<LibraryTrack[]>>;
  currentTrackIndex: number;
  setCurrentTrackIndex: Dispatch<SetStateAction<number>>;
  setCurrentTime: Dispatch<SetStateAction<number>>;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  repeatMode: RepeatMode;
  setRepeatMode: Dispatch<SetStateAction<RepeatMode>>;
  fadeToVolume: (targetVolume: number, duration?: number) => Promise<void>;
  persistPlayback: () => void;
};

export function useQueueController({
  audioRef,
  queue,
  setQueue,
  currentTrackIndex,
  setCurrentTrackIndex,
  setCurrentTime,
  setIsPlaying,
  repeatMode,
  setRepeatMode,
  fadeToVolume,
  persistPlayback,
}: QueueControllerParams) {
  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'queue';
      if (prev === 'queue') return 'track';
      return 'off';
    });
  }, [setRepeatMode]);

  const handlePrevious = useCallback(() => {
    const proceed = () => {
      if (queue.length === 0) return;

      if (currentTrackIndex > 0) {
        setCurrentTrackIndex(currentTrackIndex - 1);
      } else if (repeatMode === 'queue') {
        setCurrentTrackIndex(queue.length - 1);
      }
      setCurrentTime(0);
      setIsPlaying(true);
      persistPlayback();
    };

    if (audioRef.current && !audioRef.current.paused) {
      fadeToVolume(0, 90).then(proceed);
    } else {
      proceed();
    }
  }, [
    audioRef,
    currentTrackIndex,
    fadeToVolume,
    persistPlayback,
    queue.length,
    repeatMode,
    setCurrentTrackIndex,
    setCurrentTime,
    setIsPlaying,
  ]);

  const handleNext = useCallback(
    ({ fromEnded = false }: { fromEnded?: boolean } = {}) => {
      const proceed = () => {
        if (queue.length === 0) {
          setIsPlaying(false);
          return;
        }

        const isLastTrack = currentTrackIndex >= queue.length - 1;

        if (!isLastTrack) {
          setCurrentTrackIndex(currentTrackIndex + 1);
          setCurrentTime(0);
          setIsPlaying(true);
          persistPlayback();
          return;
        }

        if (repeatMode === 'queue') {
          setCurrentTrackIndex(0);
          setCurrentTime(0);
          setIsPlaying(true);
          persistPlayback();
          return;
        }

        if (fromEnded) {
          setIsPlaying(false);
        }
      };

      if (fromEnded || !audioRef.current || audioRef.current.paused) {
        proceed();
      } else {
        fadeToVolume(0, 90).then(proceed);
      }
    },
    [
      audioRef,
      currentTrackIndex,
      fadeToVolume,
      persistPlayback,
      queue.length,
      repeatMode,
      setCurrentTrackIndex,
      setCurrentTime,
      setIsPlaying,
    ],
  );

  const reorderUpcoming = useCallback(
    (trackIds: string[]) => {
      const prefix = queue.slice(0, currentTrackIndex + 1);
      const trackMap = new Map(queue.map((t) => [t.id, t]));
      const reordered = trackIds
        .map((id) => trackMap.get(id))
        .filter(Boolean) as LibraryTrack[];
      setQueue([...prefix, ...reordered]);
    },
    [currentTrackIndex, queue, setQueue],
  );

  const removeUpcoming = useCallback(
    (trackId: string) => {
      const newQueue = queue.filter(
        (item, index) => !(index > currentTrackIndex && item.id === trackId),
      );
      setQueue(newQueue);
    },
    [currentTrackIndex, queue, setQueue],
  );

  const clearUpcoming = useCallback(() => {
    const newQueue = queue.slice(0, currentTrackIndex + 1);
    setQueue(newQueue);
  }, [currentTrackIndex, queue, setQueue]);

  return {
    cycleRepeatMode,
    handlePrevious,
    handleNext,
    reorderUpcoming,
    removeUpcoming,
    clearUpcoming,
  };
}
