'use client';

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Dispatch,
  SetStateAction,
} from 'react';
import { LibraryTrack } from '@app-types/libraryTrack';
import { usePlaybackSaver } from '../hooks/usePlaybackSaver';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { usePlaybackHydration } from '../hooks/usePlaybackHydration';
import { useQueueController } from '../hooks/useQueueController';

interface PlayerContextProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  track: LibraryTrack | null;
  currentTime: number;
  isPlaying: boolean;
  queue: LibraryTrack[];
  currentTrackIndex: number;
  volume: number;
  isShuffle: boolean;
  repeatMode: 'off' | 'queue' | 'track';
  applyShuffleToQueue: (
    tracks?: LibraryTrack[],
    anchorIndex?: number,
    options?: { force?: boolean },
  ) => void;
  setTrack: Dispatch<SetStateAction<LibraryTrack | null>>;
  setCurrentTime: Dispatch<SetStateAction<number>>;
  togglePlayPause: () => Promise<void>;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  setQueue: Dispatch<SetStateAction<LibraryTrack[]>>;
  setCurrentTrackIndex: Dispatch<SetStateAction<number>>;
  handleVolumeChange: (volume: number) => void;
  toggleMute: () => void;
  attemptPlay: () => Promise<void>;
  setIsShuffle: Dispatch<SetStateAction<boolean>>;
  setRepeatMode: Dispatch<SetStateAction<'off' | 'queue' | 'track'>>;
  cycleRepeatMode: () => void;
  handleSeek: (time: number) => void;
  handlePrevious: () => void;
  handleNext: (options?: { fromEnded?: boolean }) => void;
  reorderUpcoming: (trackIds: string[]) => void;
  removeUpcoming: (trackId: string) => void;
  clearUpcoming: () => void;
}

export const PlayerContext = createContext<PlayerContextProps | undefined>(
  undefined,
);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [track, setTrack] = useState<LibraryTrack | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [queue, setQueue] = useState<LibraryTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isShuffle, setIsShuffleState] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'queue' | 'track'>(
    'off',
  );
  const lastLinearQueueRef = useRef<LibraryTrack[]>([]);
  const { persist: persistPlayback, debouncedPersist } = usePlaybackSaver({
    track,
    currentTime,
    isPlaying,
    queue,
    currentTrackIndex,
    volume,
    isShuffle,
    repeatMode,
  });

  const {
    fadeToVolume,
    attemptPlay,
    togglePlayPause,
    toggleMute,
    handleSeek,
    handleVolumeChange,
  } = useAudioEngine({
    audioRef,
    volume,
    setVolume,
    setCurrentTime,
    setIsPlaying,
    persistPlayback,
    debouncedPersist,
  });

  usePlaybackHydration({
    setQueue,
    setTrack,
    setCurrentTrackIndex,
    setCurrentTime,
    setIsPlaying,
    setVolume,
    setIsShuffle: useCallback((value: boolean) => setIsShuffleState(value), []),
    setRepeatMode,
  });

  const shuffleQueueWithAnchor = useCallback(
    (tracks: LibraryTrack[], anchorIndex: number) => {
      if (!tracks.length) {
        return { queue: tracks, index: 0 };
      }

      const safeIndex = Math.min(
        Math.max(anchorIndex, 0),
        tracks.length - 1,
      );
      const anchorTrack = tracks[safeIndex];
      const remainder = tracks.filter((_, idx) => idx !== safeIndex);

      for (let i = remainder.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [remainder[i], remainder[j]] = [remainder[j], remainder[i]];
      }

      return { queue: [anchorTrack, ...remainder], index: 0 };
    },
    [],
  );

  useEffect(() => {
    if (!isShuffle) {
      lastLinearQueueRef.current = [...queue];
    }
  }, [isShuffle, queue]);

  const applyShuffleToQueue = useCallback(
    (
      tracks?: LibraryTrack[],
      anchorIndex?: number,
      options?: { force?: boolean },
    ) => {
      if (!isShuffle && !options?.force) return;
      const baseQueue =
        tracks && tracks.length > 0 ? tracks.slice() : queue.slice();
      if (!baseQueue.length) return;

      const safeAnchor = Math.min(
        Math.max(anchorIndex ?? currentTrackIndex, 0),
        baseQueue.length - 1,
      );

      lastLinearQueueRef.current = [...baseQueue];
      const { queue: shuffledQueue } = shuffleQueueWithAnchor(
        baseQueue,
        safeAnchor,
      );
      setQueue(shuffledQueue);
      setCurrentTrackIndex(0);
    },
    [
      currentTrackIndex,
      isShuffle,
      queue,
      setCurrentTrackIndex,
      setQueue,
      shuffleQueueWithAnchor,
    ],
  );

  const setIsShuffle = useCallback<Dispatch<SetStateAction<boolean>>>(
    (value) => {
      const next = typeof value === 'function' ? value(isShuffle) : value;
      if (next === isShuffle) {
        if (next) {
          applyShuffleToQueue(undefined, currentTrackIndex, { force: true });
        }
        return;
      }

      if (next) {
        applyShuffleToQueue(undefined, currentTrackIndex, { force: true });
      } else {
        const baseline =
          lastLinearQueueRef.current.length > 0
            ? lastLinearQueueRef.current
            : queue;
        const currentTrackId = queue[currentTrackIndex]?.id;
        const restoredIndex = currentTrackId
          ? baseline.findIndex((track) => track.id === currentTrackId)
          : -1;
        setQueue(baseline);
        setCurrentTrackIndex(restoredIndex >= 0 ? restoredIndex : 0);
      }

      setIsShuffleState(next);
    },
    [
      applyShuffleToQueue,
      currentTrackIndex,
      isShuffle,
      queue,
      setCurrentTrackIndex,
      setQueue,
    ],
  );

  const {
    cycleRepeatMode,
    handlePrevious,
    handleNext,
    reorderUpcoming,
    removeUpcoming,
    clearUpcoming,
  } = useQueueController({
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
  });

  useEffect(() => {
    const nextTrack = queue[currentTrackIndex];
    if (!nextTrack) return;

    const audioElement = audioRef.current;
    const trackChanged = track?.id !== nextTrack.id;
    const metadataChanged = track !== nextTrack;

    if (!track || metadataChanged) {
      setTrack(nextTrack);
    }

    if (!audioElement || !isPlaying) return;

    const shouldStartPlayback = trackChanged || audioElement.paused;
    if (shouldStartPlayback) {
      attemptPlay();
    }
  }, [attemptPlay, currentTrackIndex, isPlaying, queue, track]);

  const value = useMemo(
    () => ({
      audioRef,
      track,
      currentTime,
      isPlaying,
      queue,
      currentTrackIndex,
      volume,
      isShuffle,
      repeatMode,
      applyShuffleToQueue,
      setTrack,
      setCurrentTime,
      setIsPlaying,
      setQueue,
      setCurrentTrackIndex,
      attemptPlay,
      setIsShuffle,
      setRepeatMode,
      cycleRepeatMode,
      handleSeek,
      togglePlayPause,
      toggleMute,
      handleVolumeChange,
      handlePrevious,
      handleNext,
      reorderUpcoming,
      removeUpcoming,
      clearUpcoming,
    }),
    [
      track,
      currentTime,
      isPlaying,
      queue,
      currentTrackIndex,
      volume,
      isShuffle,
      repeatMode,
      applyShuffleToQueue,
      handlePrevious,
      handleNext,
      togglePlayPause,
      toggleMute,
      handleVolumeChange,
      handleSeek,
      cycleRepeatMode,
      reorderUpcoming,
      removeUpcoming,
      clearUpcoming,
      attemptPlay,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}
