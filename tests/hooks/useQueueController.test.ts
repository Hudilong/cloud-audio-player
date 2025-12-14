import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { useQueueController } from '@/hooks/useQueueController';
import { LibraryTrack } from '@app-types/libraryTrack';
import React from 'react';

const buildTrack = (id: string): LibraryTrack => ({
  id,
  title: `Track ${id}`,
  artist: 'Artist',
  album: 'Album',
  genre: 'Genre',
  duration: 180,
  s3Key: `s3-${id}`,
  imageURL: null,
  imageBlurhash: null,
  userId: 'user-1',
  isFeatured: false,
  kind: 'user',
});

type SetupOptions = {
  queue?: LibraryTrack[];
  currentIndex?: number;
  repeatMode?: 'off' | 'queue' | 'track';
  paused?: boolean;
};

const setupController = ({
  queue: initialQueue = [buildTrack('a'), buildTrack('b')],
  currentIndex = 0,
  repeatMode = 'off',
  paused = false,
}: SetupOptions = {}) => {
  const audioRef = { current: { paused } as HTMLAudioElement };
  const fadeToVolume = vi.fn(() => Promise.resolve());
  const persistPlayback = vi.fn();

  const { result } = renderHook(() => {
    const [queue, setQueue] = React.useState<LibraryTrack[]>(initialQueue);
    const [currentTrackIndex, setCurrentTrackIndex] =
      React.useState<number>(currentIndex);
    const [currentTime, setCurrentTime] = React.useState<number>(0);
    const [isPlaying, setIsPlaying] = React.useState<boolean>(true);
    const [repeat, setRepeatMode] = React.useState<'off' | 'queue' | 'track'>(
      repeatMode,
    );

    const controller = useQueueController({
      audioRef,
      queue,
      setQueue,
      currentTrackIndex,
      setCurrentTrackIndex,
      setCurrentTime,
      setIsPlaying,
      repeatMode: repeat,
      setRepeatMode,
      fadeToVolume,
      persistPlayback,
    });

    return {
      controller,
      state: {
        queue,
        currentTrackIndex,
        currentTime,
        isPlaying,
        repeatMode: repeat,
      },
    };
  });

  return {
    result,
    audioRef,
    fadeToVolume,
    persistPlayback,
  };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useQueueController', () => {
  it('cycles repeat mode off -> queue -> track -> off', () => {
    const { result } = setupController({ repeatMode: 'off' });

    act(() => {
      result.current.controller.cycleRepeatMode();
    });
    expect(result.current.state.repeatMode).toBe('queue');

    act(() => {
      result.current.controller.cycleRepeatMode();
    });
    expect(result.current.state.repeatMode).toBe('track');

    act(() => {
      result.current.controller.cycleRepeatMode();
    });
    expect(result.current.state.repeatMode).toBe('off');
  });

  it('advances to the next track and persists when not at the end', async () => {
    const { result, fadeToVolume, persistPlayback } = setupController({
      queue: [buildTrack('one'), buildTrack('two'), buildTrack('three')],
      currentIndex: 0,
      paused: false,
    });

    await act(async () => {
      await result.current.controller.handleNext();
    });

    expect(fadeToVolume).toHaveBeenCalledWith(0, 90);
    expect(result.current.state.currentTrackIndex).toBe(1);
    expect(result.current.state.currentTime).toBe(0);
    expect(result.current.state.isPlaying).toBe(true);
    expect(persistPlayback).toHaveBeenCalled();
  });

  it('skips fade when advancing from an ended track', async () => {
    const { result, fadeToVolume } = setupController({
      queue: [buildTrack('one'), buildTrack('two')],
      currentIndex: 1,
      paused: false,
    });

    await act(async () => {
      await result.current.controller.handleNext({ fromEnded: true });
    });

    expect(fadeToVolume).not.toHaveBeenCalled();
    expect(result.current.state.currentTrackIndex).toBe(1);
    expect(result.current.state.isPlaying).toBe(false);
  });

  it('wraps to the end of the queue on previous when repeating the queue', async () => {
    const { result, fadeToVolume } = setupController({
      queue: [buildTrack('one'), buildTrack('two'), buildTrack('three')],
      currentIndex: 0,
      repeatMode: 'queue',
      paused: false,
    });

    await act(async () => {
      await result.current.controller.handlePrevious();
    });

    expect(fadeToVolume).toHaveBeenCalledWith(0, 90);
    expect(result.current.state.currentTrackIndex).toBe(2);
    expect(result.current.state.isPlaying).toBe(true);
  });

  it('reorders upcoming tracks after the current track', () => {
    const queue = [
      buildTrack('a'),
      buildTrack('b'),
      buildTrack('c'),
      buildTrack('d'),
    ];
    const { result } = setupController({ queue, currentIndex: 1 });

    act(() => {
      result.current.controller.reorderUpcoming(['d', 'c']);
    });

    expect(result.current.state.queue.map((t) => t.id)).toEqual([
      'a',
      'b',
      'd',
      'c',
    ]);
  });

  it('removes and clears upcoming tracks', () => {
    const queue = [buildTrack('a'), buildTrack('b'), buildTrack('c')];
    const { result } = setupController({ queue, currentIndex: 0 });

    act(() => {
      result.current.controller.removeUpcoming('c');
    });

    expect(result.current.state.queue.map((t) => t.id)).toEqual(['a', 'b']);

    act(() => {
      result.current.controller.clearUpcoming();
    });

    expect(result.current.state.queue.map((t) => t.id)).toEqual(['a']);
  });
});
