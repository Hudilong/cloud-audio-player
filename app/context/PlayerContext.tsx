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

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  }, [audioRef, isPlaying]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [audioRef, isMuted]);

  const handleSeek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

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
  }, [isShuffle, currentTrackIndex, repeatMode, queue.length, playRandomTrack]);

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
        return;
      }

      if (repeatMode === 'queue') {
        setCurrentTrackIndex(0);
        setCurrentTime(0);
        setIsPlaying(true);
        return;
      }

      if (fromEnded) {
        setIsPlaying(false);
      }
    },
    [currentTrackIndex, isShuffle, playRandomTrack, queue.length, repeatMode],
  );

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

    audioPlayer?.addEventListener('timeupdate', updateTime);

    return () => {
      audioPlayer?.removeEventListener('timeupdate', updateTime);
    };
  }, []);

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
    ],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}
