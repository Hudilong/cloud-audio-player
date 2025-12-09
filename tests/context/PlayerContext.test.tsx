import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { PlayerContext, PlayerProvider } from '@/context/PlayerContext';
import { buildTrack } from '../helpers/mockPlayerContext';

describe('PlayerContext', () => {
  it('toggles play/pause using the underlying audio element', async () => {
    const play = vi.fn().mockResolvedValue(undefined);
    const pause = vi.fn();

    const { result } = renderHook(() => React.useContext(PlayerContext)!, {
      wrapper: PlayerProvider,
    });

    act(() => {
      const audioRef = result.current
        .audioRef as React.MutableRefObject<HTMLAudioElement | null>;
      audioRef.current = { play, pause } as unknown as HTMLAudioElement;
    });

    await act(async () => {
      await result.current.togglePlayPause();
    });
    expect(play).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(true);

    await act(async () => {
      await result.current.togglePlayPause();
    });
    expect(pause).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);
  });

  it('updates volume on both state and element', () => {
    const { result } = renderHook(() => React.useContext(PlayerContext)!, {
      wrapper: PlayerProvider,
    });

    const audio = { volume: 1 } as HTMLAudioElement;

    act(() => {
      const audioRef = result.current
        .audioRef as React.MutableRefObject<HTMLAudioElement | null>;
      audioRef.current = audio;
      result.current.handleVolumeChange(0.4);
    });

    expect(result.current.volume).toBe(0.4);
    expect(audio.volume).toBe(0.4);
  });

  it('seeks and updates currentTime', () => {
    const { result } = renderHook(() => React.useContext(PlayerContext)!, {
      wrapper: PlayerProvider,
    });

    const audio = { currentTime: 0 } as HTMLAudioElement;

    act(() => {
      const audioRef = result.current
        .audioRef as React.MutableRefObject<HTMLAudioElement | null>;
      audioRef.current = audio;
      result.current.handleSeek(42);
    });

    expect(result.current.currentTime).toBe(42);
    expect(audio.currentTime).toBe(42);
  });

  it('navigates queue forward and backward', () => {
    const trackA = buildTrack({ id: 'a' });
    const trackB = buildTrack({ id: 'b' });

    const { result } = renderHook(() => React.useContext(PlayerContext)!, {
      wrapper: PlayerProvider,
    });

    act(() => {
      result.current.setQueue([trackA, trackB]);
    });

    act(() => {
      result.current.handleNext();
    });

    expect(result.current.currentTrackIndex).toBe(1);
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.currentTime).toBe(0);

    act(() => {
      result.current.setCurrentTrackIndex(0);
      result.current.setIsRepeat(true);
    });

    act(() => {
      result.current.handlePrevious();
    });

    expect(result.current.currentTrackIndex).toBe(1);
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.currentTime).toBe(0);
  });
});
