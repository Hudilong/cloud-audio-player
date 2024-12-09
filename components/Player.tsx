'use client';

import React, { useContext, useEffect, useState } from 'react';
import { PlayerContext } from '@/context/PlayerContext';
import TrackInfoDisplay from './TrackInfoDisplay';
import PlayerControls from './PlayerControls';
import ExtraControls from './ExtraControls';
import ProgressBar from './ProgressBar';

function Player() {
  const playerContext = useContext(PlayerContext);
  const [streamURL, setStreamURL] = useState<string | null>(null);

  if (!playerContext) {
    throw new Error('Player must be used within a PlayerProvider');
  }

  const {
    audioRef,
    audio,
    isRepeat,
    setCurrentTime,
    setIsPlaying,
    handleNext,
  } = playerContext;

  useEffect(() => {
    // Fetch the user's audio tracks
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
    if (audio && audio.id) fetchStreamURL(audio.id);
  }, [audio]);

  useEffect(() => {
    audioRef.current?.play();
  }, [streamURL, audioRef]);

  return (
    audio &&
    streamURL && (
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-4 shadow-md">
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
        <div className="flex items-center justify-between">
          <PlayerControls />
          <TrackInfoDisplay />
          <ExtraControls />
        </div>
        <ProgressBar />
      </div>
    )
  );
}

export default Player;
