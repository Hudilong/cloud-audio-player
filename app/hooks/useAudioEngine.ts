'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type QueuePersist = () => void;

type AudioEngineParams = {
  audioRef: React.RefObject<HTMLAudioElement>;
  volume: number;
  setVolume: (value: number) => void;
  setCurrentTime: (value: number) => void;
  setIsPlaying: (value: boolean) => void;
  persistPlayback: QueuePersist;
  debouncedPersist: QueuePersist;
};

export function useAudioEngine({
  audioRef,
  volume,
  setVolume,
  setCurrentTime,
  setIsPlaying,
  persistPlayback,
  debouncedPersist,
}: AudioEngineParams) {
  const fadeRaf = useRef<number | null>(null);
  const endFadeStarted = useRef<boolean>(false);
  const [isMuted, setIsMuted] = useState(false);

  const cancelFade = useCallback(() => {
    if (fadeRaf.current) {
      cancelAnimationFrame(fadeRaf.current);
      fadeRaf.current = null;
    }
  }, []);

  const setAudioVolume = useCallback(
    (value: number) => {
      const player = audioRef.current;
      if (player) {
        const clamped = Math.max(0, Math.min(1, value));
        player.volume = clamped;
      }
    },
    [audioRef],
  );

  const fadeToVolume = useCallback(
    (targetVolume: number, duration = 90) => {
      if (!audioRef.current) return Promise.resolve();
      cancelFade();
      const isVisible =
        typeof document === 'undefined' ||
        document.visibilityState === 'visible';
      if (!isVisible) {
        setAudioVolume(targetVolume);
        return Promise.resolve();
      }
      const start = performance.now();
      const startVolume = audioRef.current.volume;

      return new Promise<void>((resolve) => {
        const step = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const next = startVolume + (targetVolume - startVolume) * progress;
          setAudioVolume(next);
          if (progress < 1) {
            fadeRaf.current = requestAnimationFrame(step);
          } else {
            fadeRaf.current = null;
            resolve();
          }
        };
        fadeRaf.current = requestAnimationFrame(step);
      });
    },
    [audioRef, cancelFade, setAudioVolume],
  );

  const attemptPlay = useCallback(async () => {
    const player = audioRef.current;
    if (!player) return;

    cancelFade();
    const targetVolume = volume;
    setAudioVolume(0);

    try {
      await player.play();
      await fadeToVolume(targetVolume, 100);
    } catch (error) {
      const errorName = (error as DOMException | undefined)?.name;
      if (errorName === 'NotAllowedError') {
        setIsPlaying(false);
      }
    }
  }, [
    audioRef,
    cancelFade,
    fadeToVolume,
    setAudioVolume,
    setIsPlaying,
    volume,
  ]);

  const togglePlayPause = useCallback(async () => {
    const player = audioRef.current;
    if (!player) return;
    if (player.paused) {
      setIsPlaying(true);
      attemptPlay();
      return;
    }

    cancelFade();
    await fadeToVolume(0, 90);
    player.pause();
    setAudioVolume(volume);
    persistPlayback();
    setIsPlaying(false);
  }, [
    attemptPlay,
    audioRef,
    cancelFade,
    fadeToVolume,
    persistPlayback,
    setAudioVolume,
    setIsPlaying,
    volume,
  ]);

  const toggleMute = useCallback(() => {
    const player = audioRef.current;
    if (!player) return;
    player.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [audioRef, isMuted]);

  const handleSeek = useCallback(
    (time: number) => {
      const player = audioRef.current;
      if (!player) return;
      player.currentTime = time;
      setCurrentTime(time);
      endFadeStarted.current = false;
      debouncedPersist();
    },
    [audioRef, debouncedPersist, setCurrentTime],
  );

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      const target = Math.max(0, Math.min(1, newVolume));
      setVolume(target);
      cancelFade();
      fadeToVolume(target, 100);
    },
    [cancelFade, fadeToVolume, setVolume],
  );

  useEffect(() => {
    const audioPlayer = audioRef.current;

    const updateTime = () => {
      if (audioPlayer) {
        const { currentTime: audioCurrentTime, duration, paused } = audioPlayer;
        setCurrentTime(audioCurrentTime);
        if (
          duration &&
          Number.isFinite(duration) &&
          !Number.isNaN(duration) &&
          !paused
        ) {
          const remaining = duration - audioCurrentTime;
          const threshold = 0.18; // seconds
          if (remaining <= threshold && !endFadeStarted.current) {
            endFadeStarted.current = true;
            fadeToVolume(0, 80);
          } else if (remaining > threshold + 0.05) {
            endFadeStarted.current = false;
          }
        }
      }
    };

    const handlePause = () => {
      endFadeStarted.current = false;
      persistPlayback();
    };

    audioPlayer?.addEventListener('timeupdate', updateTime);
    audioPlayer?.addEventListener('pause', handlePause);

    return () => {
      audioPlayer?.removeEventListener('timeupdate', updateTime);
      audioPlayer?.removeEventListener('pause', handlePause);
      persistPlayback();
    };
  }, [audioRef, fadeToVolume, persistPlayback, setCurrentTime]);

  useEffect(() => {
    cancelFade();
    setAudioVolume(volume);
  }, [volume, cancelFade, setAudioVolume]);

  useEffect(() => {
    const handleVisibility = () => {
      const player = audioRef.current;
      if (!player) return;
      if (
        document.visibilityState === 'visible' &&
        !player.paused &&
        player.volume === 0
      ) {
        setAudioVolume(volume);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility);
  }, [audioRef, setAudioVolume, volume]);

  useEffect(() => () => cancelFade(), [cancelFade]);

  return {
    fadeToVolume,
    attemptPlay,
    togglePlayPause,
    toggleMute,
    handleSeek,
    handleVolumeChange,
    endFadeStarted,
    cancelFade,
  };
}
