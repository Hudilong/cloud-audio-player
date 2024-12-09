'use client';

import React, {
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import { Audio } from '@prisma/client';

interface PlayerContextProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  audio: Audio | null;
  currentTime: number;
  isPlaying: boolean;
  playlist: Audio[];
  currentTrackIndex: number;
  volume: number;
  isShuffle: boolean;
  isRepeat: boolean;
  setAudio: (audio: Audio | null) => void;
  setCurrentTime: (position: number) => void;
  togglePlayPause: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaylist: (tracks: Audio[]) => void;
  setCurrentTrackIndex: (index: number) => void;
  handleVolumeChange: (volume: number) => void;
  toggleMute: () => void;
  setIsShuffle: (shuffle: boolean) => void;
  setIsRepeat: (repeat: boolean) => void;
  handleSeek: (time: number) => void;
  handlePrevious: () => void;
  handleNext: () => void;
}

export const PlayerContext = createContext<PlayerContextProps | undefined>(
  undefined,
);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audio, setAudio] = useState<Audio | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playlist, setPlaylist] = useState<Audio[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);

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

  const playRandomTrack = useCallback(() => {
    if (playlist.length === 0) return;

    let randomIndex = Math.floor(Math.random() * playlist.length);

    if (playlist.length > 1) {
      while (randomIndex === currentTrackIndex) {
        randomIndex = Math.floor(Math.random() * playlist.length);
      }
    }

    setCurrentTrackIndex(randomIndex);
  }, [playlist, currentTrackIndex]);

  const handlePrevious = useCallback(() => {
    if (isShuffle) {
      playRandomTrack();
    } else if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    } else if (isRepeat) {
      setCurrentTrackIndex(playlist.length - 1);
    }
  }, [
    isShuffle,
    currentTrackIndex,
    isRepeat,
    playlist.length,
    playRandomTrack,
  ]);

  const handleNext = useCallback(() => {
    if (isShuffle) {
      playRandomTrack();
    } else if (currentTrackIndex < playlist.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
    } else if (isRepeat) {
      setCurrentTrackIndex(0);
    }
  }, [
    isShuffle,
    currentTrackIndex,
    playlist.length,
    isRepeat,
    playRandomTrack,
  ]);

  useEffect(() => {
    if (!audioRef.current || !playlist[currentTrackIndex]) return;
    setAudio(playlist[currentTrackIndex]);

    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    }
  }, [currentTrackIndex, playlist, isPlaying]);

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
      audio,
      currentTime,
      isPlaying,
      playlist,
      currentTrackIndex,
      volume,
      isShuffle,
      isRepeat,
      setAudio,
      setCurrentTime,
      setIsPlaying,
      setPlaylist,
      setCurrentTrackIndex,
      setIsShuffle,
      setIsRepeat,
      handleSeek,
      togglePlayPause,
      toggleMute,
      handleVolumeChange,
      handlePrevious,
      handleNext,
    }),
    [
      audio,
      currentTime,
      isPlaying,
      playlist,
      currentTrackIndex,
      volume,
      isShuffle,
      isRepeat,
      handlePrevious,
      handleNext,
      togglePlayPause,
      toggleMute,
      handleVolumeChange,
      handleSeek,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}
