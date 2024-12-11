'use client';

import React, { useEffect, useContext, useState } from 'react';
import { Track } from '@prisma/client';
import { PlayerContext } from '@/context/PlayerContext';
import TrackCard from '../../components/TrackCard';

export default function Library(): JSX.Element {
  const playerContext = useContext(PlayerContext);
  const [library, setLibrary] = useState<Track[]>([]);

  if (!playerContext) {
    throw new Error('Library must be used within a PlayerProvider');
  }

  const {
    setTrack,
    setCurrentTime,
    setIsPlaying,
    setCurrentTrackIndex,
    setPlaylist,
  } = playerContext;

  useEffect(() => {
    // Fetch the user's audio tracks
    async function fetchTracks() {
      try {
        const res = await fetch('/api/tracks');
        if (res.ok) {
          const data = await res.json();
          setLibrary(data.tracks);
        } else {
          console.error('Failed to fetch tracks');
        }
      } catch (error) {
        console.error('Error fetching tracks:', error);
      }
    }
    fetchTracks();
  }, []);

  const handleTrackSelect = (selectedAudio: Track) => {
    setPlaylist(library);
    const index = library.findIndex((track) => track.id === selectedAudio.id);
    setCurrentTrackIndex(index);
    setTrack(selectedAudio);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  if (!library || library.length === 0) {
    return <p>You haven&apos;t uploaded any audio tracks yet.</p>;
  }

  return (
    <div className="w-full flex-col px-48 py-32">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-16">
        {library.map((track) => (
          <TrackCard
            track={track}
            onSelect={handleTrackSelect}
            key={track.id}
          />
        ))}
      </div>
    </div>
  );
}
