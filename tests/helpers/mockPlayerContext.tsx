import type React from 'react';
import { createRef } from 'react';
import type { Track } from '@prisma/client';
import { PlayerContext } from '@/context/PlayerContext';

export type PlayerContextValue = NonNullable<
  React.ContextType<typeof PlayerContext>
>;

export const buildTrack = (overrides: Partial<Track> = {}): Track => {
  const now = new Date();
  return {
    id: 'track-1',
    title: 'Sample Track',
    artist: 'Artist',
    album: 'Album',
    genre: 'Genre',
    duration: 180,
    imageURL: null,
    s3Key: 's3-key',
    userId: 'user-1',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

export const createMockPlayerContext = (
  overrides: Partial<PlayerContextValue> = {},
): PlayerContextValue => {
  const audioRef = overrides.audioRef || createRef<HTMLAudioElement>();

  return {
    audioRef,
    track: null,
    currentTime: 0,
    isPlaying: false,
    queue: [],
    currentTrackIndex: 0,
    volume: 1,
    isShuffle: false,
    repeatMode: 'off',
    applyShuffleToQueue: () => {},
    setTrack: () => {},
    setCurrentTime: () => {},
    togglePlayPause: () => {},
    setIsPlaying: () => {},
    setQueue: () => {},
    setCurrentTrackIndex: () => {},
    handleVolumeChange: () => {},
    toggleMute: () => {},
    attemptPlay: () => {
      audioRef.current?.play?.();
    },
    setIsShuffle: () => {},
    setRepeatMode: () => {},
    cycleRepeatMode: () => {},
    handleSeek: () => {},
    handlePrevious: () => {},
    handleNext: () => {},
    ...overrides,
  };
};
