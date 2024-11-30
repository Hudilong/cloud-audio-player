"use client";

import React, { createContext, useEffect, useRef, useState } from "react";
import { Audio } from "@prisma/client";

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
    undefined
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

    // Toggle play/pause
    const togglePlayPause = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch((error) => {
                console.error("Error playing audio:", error);
            });
        }
        setIsPlaying(!isPlaying);
    };

    // Toggle mute/unmute
    const toggleMute = () => {
        if (!audioRef.current) return;
        audioRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    // Handle seeking within the track
    const handleSeek = (time: number) => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    // Handle volume change
    const handleVolumeChange = (newVolume: number) => {
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };

    // Handle Previous Track
    const handlePrevious = () => {
        if (isShuffle) {
            playRandomTrack();
        } else {
            if (currentTrackIndex > 0) {
                setCurrentTrackIndex(currentTrackIndex - 1);
            } else {
                if (isRepeat) {
                    setCurrentTrackIndex(playlist.length - 1);
                }
                // Optional: else, do nothing or restart current track
            }
        }
    };

    // Handle Next Track
    const handleNext = () => {
        if (isShuffle) {
            playRandomTrack();
        } else {
            if (currentTrackIndex < playlist.length - 1) {
                setCurrentTrackIndex(currentTrackIndex + 1);
            } else {
                if (isRepeat) {
                    setCurrentTrackIndex(0);
                }
                // Optional: else, do nothing or stop playback
            }
        }
    };

    // Helper function to play a random track
    const playRandomTrack = () => {
        if (playlist.length === 0) return;

        let randomIndex = Math.floor(Math.random() * playlist.length);

        // Ensure that the same track is not played again if there's more than one track
        if (playlist.length > 1) {
            while (randomIndex === currentTrackIndex) {
                randomIndex = Math.floor(Math.random() * playlist.length);
            }
        }

        setCurrentTrackIndex(randomIndex);
    };

    // Update audio source when currentTrackIndex changes
    useEffect(() => {
        if (!audioRef.current || !playlist[currentTrackIndex]) return;
        setAudio(playlist[currentTrackIndex]);

        if (isPlaying) {
            audioRef.current.play().catch((error) => {
                console.error("Error playing audio:", error);
            });
        }
    }, [currentTrackIndex, playlist, isPlaying]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => {
            setCurrentTime(audio.currentTime);
        };

        audio.addEventListener("timeupdate", updateTime);

        return () => {
            audio.removeEventListener("timeupdate", updateTime);
        };
    }, []);

    return (
        <PlayerContext.Provider
            value={{
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
            }}
        >
            {children}
        </PlayerContext.Provider>
    );
}
