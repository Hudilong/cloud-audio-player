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
      audioRef.current = {
        play,
        pause,
        paused: true,
        volume: 1,
      } as unknown as HTMLAudioElement;
    });

    await act(async () => {
      await result.current.togglePlayPause();
    });
    expect(play).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(true);

    act(() => {
      const audioRef = result.current
        .audioRef as React.MutableRefObject<HTMLAudioElement | null>;
      if (audioRef.current) {
        audioRef.current.paused = false;
      }
    });

    await act(async () => {
      await result.current.togglePlayPause();
    });
    expect(pause).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);
  });

  it('turns isPlaying back off when the browser blocks autoplay', async () => {
    const play = vi
      .fn()
      .mockRejectedValue(
        new DOMException('Autoplay blocked', 'NotAllowedError'),
      );
    const pause = vi.fn();

    const { result } = renderHook(() => React.useContext(PlayerContext)!, {
      wrapper: PlayerProvider,
    });

    act(() => {
      const audioRef = result.current
        .audioRef as React.MutableRefObject<HTMLAudioElement | null>;
      audioRef.current = {
        play,
        pause,
        paused: true,
        volume: 1,
      } as unknown as HTMLAudioElement;
    });

    await act(async () => {
      await result.current.togglePlayPause();
      await Promise.resolve();
    });

    expect(play).toHaveBeenCalled();
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
      result.current.setRepeatMode('queue');
    });

    act(() => {
      result.current.handlePrevious();
    });

    expect(result.current.currentTrackIndex).toBe(1);
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.currentTime).toBe(0);
  });

  it('cycles repeat modes through off -> queue -> track -> off', () => {
    const { result } = renderHook(() => React.useContext(PlayerContext)!, {
      wrapper: PlayerProvider,
    });

    act(() => {
      result.current.cycleRepeatMode();
    });
    expect(result.current.repeatMode).toBe('queue');

    act(() => {
      result.current.cycleRepeatMode();
    });
    expect(result.current.repeatMode).toBe('track');

    act(() => {
      result.current.cycleRepeatMode();
    });
    expect(result.current.repeatMode).toBe('off');
  });

  it('wraps to start when repeat queue is enabled on next()', () => {
    const trackA = buildTrack({ id: 'a' });
    const trackB = buildTrack({ id: 'b' });

    const { result } = renderHook(() => React.useContext(PlayerContext)!, {
      wrapper: PlayerProvider,
    });

    act(() => {
      result.current.setQueue([trackA, trackB]);
      result.current.setCurrentTrackIndex(1);
      result.current.setRepeatMode('queue');
    });

    act(() => {
      result.current.handleNext();
    });

    expect(result.current.currentTrackIndex).toBe(0);
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.currentTime).toBe(0);
  });

  it('stops playback at end when repeat is off and next is triggered from ended', () => {
    const trackA = buildTrack({ id: 'a' });
    const trackB = buildTrack({ id: 'b' });

    const { result } = renderHook(() => React.useContext(PlayerContext)!, {
      wrapper: PlayerProvider,
    });

    act(() => {
      result.current.setQueue([trackA, trackB]);
      result.current.setCurrentTrackIndex(1);
      result.current.setRepeatMode('off');
      result.current.setIsPlaying(true);
      result.current.handleNext({ fromEnded: true });
    });

    expect(result.current.currentTrackIndex).toBe(1);
    expect(result.current.isPlaying).toBe(false);
  });

  it('reorders, removes, and clears upcoming tracks', () => {
    const trackA = buildTrack({ id: 'a' });
    const trackB = buildTrack({ id: 'b' });
    const trackC = buildTrack({ id: 'c' });

    const { result } = renderHook(() => React.useContext(PlayerContext)!, {
      wrapper: PlayerProvider,
    });

    act(() => {
      result.current.setQueue([trackA, trackB, trackC]);
      result.current.setCurrentTrackIndex(0);
    });

    act(() => {
      result.current.reorderUpcoming(['c', 'b']);
    });
    expect(result.current.queue.map((t) => t.id)).toEqual(['a', 'c', 'b']);

    act(() => {
      result.current.removeUpcoming('c');
    });
    expect(result.current.queue.map((t) => t.id)).toEqual(['a', 'b']);

    act(() => {
      result.current.clearUpcoming();
    });
    expect(result.current.queue.map((t) => t.id)).toEqual(['a']);
  });

  it('does not restart playback when reordering upcoming tracks', async () => {
    const trackA = buildTrack({ id: 'a' });
    const trackB = buildTrack({ id: 'b' });
    const play = vi.fn().mockResolvedValue(undefined);
    const audio = { volume: 1, paused: false, play } as HTMLAudioElement;

    const { result } = renderHook(() => React.useContext(PlayerContext)!, {
      wrapper: PlayerProvider,
    });

    act(() => {
      const audioRef = result.current
        .audioRef as React.MutableRefObject<HTMLAudioElement | null>;
      audioRef.current = audio;
      result.current.setTrack(trackA);
      result.current.setQueue([trackA, trackB]);
      result.current.setCurrentTrackIndex(0);
      result.current.setIsPlaying(true);
    });

    await act(async () => {
      result.current.reorderUpcoming(['b']);
    });

    expect(play).not.toHaveBeenCalled();
    expect(audio.volume).toBe(1);
  });
});
