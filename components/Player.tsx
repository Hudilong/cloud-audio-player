'use client';

import React, { useContext, useEffect, useState } from 'react';
import { PlayerContext } from '@/context/PlayerContext';
import TrackInfoDisplay from './TrackInfoDisplay';
import PlayerControls from './PlayerControls';
import ExtraControls from './ExtraControls';
import ProgressBar from './ProgressBar';

export default function Player() {
  const playerContext = useContext(PlayerContext);
  const [streamURL, setStreamURL] = useState<string | null>(null);

  if (!playerContext) {
    throw new Error('Player must be used within a PlayerProvider');
  }

  const {
    audioRef,
    track,
    isRepeat,
    setCurrentTime,
    setIsPlaying,
    handleNext,
  } = playerContext;

  useEffect(() => {
    async function fetchStreamURL(id: string) {
      try {
        const res = await fetch(`/api/tracks/stream-url?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setStreamURL(data.streamURL);
        }
      } catch {
        setStreamURL('');
      }
    }
    if (track && track.id) fetchStreamURL(track.id);
  }, [track]);

  useEffect(() => {
    audioRef.current?.play();
  }, [streamURL, audioRef]);

  return (
    track &&
    streamURL && (
      <div className="fixed bottom-0 left-0 right-0 bg-accentLight dark:bg-accentDark text-textLight dark:text-textDark shadow-md h-16 sm:h-20 px-4 sm:px-6 flex flex-col justify-around">
        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={streamURL}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }}
          onEnded={() => {
            if (isRepeat) {
              setCurrentTime(0);
              setIsPlaying(true);
            } else {
              handleNext();
            }
          }}
          autoPlay
        />

        {/* Player Controls */}
        <div className="flex items-center justify-between text-xs sm:text-base mb-1 sm:mb-0">
          <PlayerControls />
          <TrackInfoDisplay />
          <ExtraControls />
        </div>

        {/* Compact Progress Bar */}
        <div className="flex items-center">
          <ProgressBar />
        </div>
      </div>
    )
  );
}
