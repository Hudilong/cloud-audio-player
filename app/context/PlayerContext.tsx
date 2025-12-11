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
import { Track } from '@prisma/client';
import { usePlaybackSaver } from '../hooks/usePlaybackSaver';

interface PlayerContextProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  track: Track | null;
  currentTime: number;
  isPlaying: boolean;
  queue: Track[];
  currentTrackIndex: number;
  volume: number;
  isShuffle: boolean;
  repeatMode: 'off' | 'queue' | 'track';
  setTrack: Dispatch<SetStateAction<Track | null>>;
  setCurrentTime: Dispatch<SetStateAction<number>>;
  togglePlayPause: () => void;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  setQueue: Dispatch<SetStateAction<Track[]>>;
  setCurrentTrackIndex: Dispatch<SetStateAction<number>>;
  handleVolumeChange: (volume: number) => void;
  toggleMute: () => void;
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
  const [track, setTrack] = useState<Track | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
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

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      persistPlayback();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  }, [audioRef, isPlaying, persistPlayback]);

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
      debouncedPersist();
    },
    [debouncedPersist],
  );

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

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
  }, [
    isShuffle,
    currentTrackIndex,
    repeatMode,
    queue.length,
    playRandomTrack,
    persistPlayback,
  ]);

  const handleNext = useCallback(
    ({ fromEnded = false }: { fromEnded?: boolean } = {}) => {
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
    },
    [
      currentTrackIndex,
      isShuffle,
      playRandomTrack,
      queue.length,
      repeatMode,
      persistPlayback,
    ],
  );

  const reorderUpcoming = useCallback(
    (trackIds: string[]) => {
      const prefix = queue.slice(0, currentTrackIndex + 1);
      const trackMap = new Map(queue.map((t) => [t.id, t]));
      const reordered = trackIds
        .map((id) => trackMap.get(id))
        .filter(Boolean) as Track[];
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
      audioRef.current.play().catch(() => {});
    }
  }, [currentTrackIndex, queue, isPlaying]);

  useEffect(() => {
    const audioPlayer = audioRef.current;

    const updateTime = () => {
      if (audioPlayer) {
        setCurrentTime(audioPlayer.currentTime);
      }
    };

    const handlePause = () => {
      persistPlayback();
    };

    audioPlayer?.addEventListener('timeupdate', updateTime);
    audioPlayer?.addEventListener('pause', handlePause);

    return () => {
      audioPlayer?.removeEventListener('timeupdate', updateTime);
      audioPlayer?.removeEventListener('pause', handlePause);
      persistPlayback();
    };
  }, [persistPlayback]);

  useEffect(() => {
    const fetchPlayback = async () => {
      try {
        const res = await fetch('/api/playback');
        if (!res.ok) return;
        const data = await res.json();
        if (!data.track && !data.trackId) return;

        const restoredQueue: Track[] = data.queue || [];
        setQueue(restoredQueue);

        const fallbackTrack =
          restoredQueue[data.currentTrackIndex] || data.track || null;

        setTrack(fallbackTrack);
        setCurrentTrackIndex(data.currentTrackIndex || 0);
        setCurrentTime(data.position || 0);
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
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

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
    ],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}
