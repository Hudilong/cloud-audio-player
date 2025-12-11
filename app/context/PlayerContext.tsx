'use client';

import React, {
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  Dispatch,
  SetStateAction,
} from 'react';
import { LibraryTrack } from '@app-types/libraryTrack';
import { usePlaybackSaver } from '../hooks/usePlaybackSaver';

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
  setTrack: Dispatch<SetStateAction<LibraryTrack | null>>;
  setCurrentTime: Dispatch<SetStateAction<number>>;
  togglePlayPause: () => Promise<void>;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  setQueue: Dispatch<SetStateAction<LibraryTrack[]>>;
  setCurrentTrackIndex: Dispatch<SetStateAction<number>>;
  handleVolumeChange: (volume: number) => void;
  toggleMute: () => void;
  attemptPlay: () => void;
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
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const fadeRaf = useRef<number | null>(null);
  const endFadeStarted = useRef<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'queue' | 'track'>(
    'off',
  );
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

  const cancelFade = useCallback(() => {
    if (fadeRaf.current) {
      cancelAnimationFrame(fadeRaf.current);
      fadeRaf.current = null;
    }
  }, []);

  const setAudioVolume = useCallback((value: number) => {
    if (audioRef.current) {
      const clamped = Math.max(0, Math.min(1, value));
      audioRef.current.volume = clamped;
    }
  }, []);

  const fadeToVolume = useCallback(
    (targetVolume: number, duration = 90) => {
      if (!audioRef.current) return Promise.resolve();
      cancelFade();
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
    [cancelFade, setAudioVolume],
  );

  const attemptPlay = useCallback(() => {
    if (!audioRef.current) return;

    cancelFade();
    const targetVolume = volume;
    setAudioVolume(0);

    const playPromise = audioRef.current.play();
    if (playPromise?.catch) {
      playPromise
        .then(() => fadeToVolume(targetVolume, 100))
        .catch((error: unknown) => {
          const errorName = (error as DOMException | undefined)?.name;
          if (errorName === 'NotAllowedError') {
            setIsPlaying(false);
          }
        });
    } else {
      fadeToVolume(targetVolume, 100);
    }
  }, [cancelFade, fadeToVolume, setAudioVolume, setIsPlaying, volume]);

  const togglePlayPause = useCallback(async () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      cancelFade();
      await fadeToVolume(0, 90);
      audioRef.current.pause();
      setAudioVolume(volume);
      persistPlayback();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    attemptPlay();
  }, [
    audioRef,
    attemptPlay,
    isPlaying,
    persistPlayback,
    volume,
    fadeToVolume,
    cancelFade,
    setAudioVolume,
  ]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [audioRef, isMuted]);

  const handleSeek = useCallback(
    (time: number) => {
      if (!audioRef.current) return;
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      endFadeStarted.current = false;
      debouncedPersist();
    },
    [debouncedPersist],
  );

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      cancelFade();
      setVolume(newVolume);
      setAudioVolume(newVolume);
    },
    [cancelFade, setAudioVolume],
  );

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'queue';
      if (prev === 'queue') return 'track';
      return 'off';
    });
  }, []);

  const playRandomTrack = useCallback(() => {
    if (queue.length === 0) return;

    let randomIndex = Math.floor(Math.random() * queue.length);

    if (queue.length > 1) {
      while (randomIndex === currentTrackIndex) {
        randomIndex = Math.floor(Math.random() * queue.length);
      }
    }

    setCurrentTrackIndex(randomIndex);
  }, [queue, currentTrackIndex]);

  const handlePrevious = useCallback(() => {
    endFadeStarted.current = false;
    const proceed = () => {
      if (isShuffle) {
        playRandomTrack();
      } else if (currentTrackIndex > 0) {
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
    isShuffle,
    currentTrackIndex,
    repeatMode,
    queue.length,
    playRandomTrack,
    persistPlayback,
    audioRef,
    fadeToVolume,
  ]);

  const handleNext = useCallback(
    ({ fromEnded = false }: { fromEnded?: boolean } = {}) => {
      endFadeStarted.current = false;
      const proceed = () => {
        if (queue.length === 0) {
          setIsPlaying(false);
          return;
        }

        if (isShuffle) {
          playRandomTrack();
          setCurrentTime(0);
          setIsPlaying(true);
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
      currentTrackIndex,
      isShuffle,
      playRandomTrack,
      queue.length,
      repeatMode,
      persistPlayback,
      audioRef,
      fadeToVolume,
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
    [currentTrackIndex, queue],
  );

  const removeUpcoming = useCallback(
    (trackId: string) => {
      const newQueue = queue.filter(
        (item, index) => !(index > currentTrackIndex && item.id === trackId),
      );
      setQueue(newQueue);
    },
    [currentTrackIndex, queue],
  );

  const clearUpcoming = useCallback(() => {
    const newQueue = queue.slice(0, currentTrackIndex + 1);
    setQueue(newQueue);
  }, [currentTrackIndex, queue]);

  useEffect(() => {
    if (!audioRef.current || !queue[currentTrackIndex]) return;
    setTrack(queue[currentTrackIndex]);

    if (isPlaying) {
      attemptPlay();
    }
  }, [attemptPlay, currentTrackIndex, queue, isPlaying]);

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
  }, [fadeToVolume, persistPlayback]);

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

        const normalizedFallback = fallbackTrack
          ? {
              ...fallbackTrack,
              kind: fallbackTrack.kind === 'featured' ? 'featured' : 'user',
            }
          : null;

        setTrack(normalizedFallback);
        setCurrentTrackIndex(data.currentTrackIndex || 0);
        setCurrentTime(data.position || 0);
        endFadeStarted.current = false;
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
  }, []);

  useEffect(() => {
    cancelFade();
    setAudioVolume(volume);
  }, [volume, cancelFade, setAudioVolume]);

  useEffect(() => () => cancelFade(), [cancelFade]);

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
