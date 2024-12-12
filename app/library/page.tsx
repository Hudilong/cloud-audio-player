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

  const handleTrackSelect = (selectedTrack: Track) => {
    setPlaylist(library);
    const index = library.findIndex((track) => track.id === selectedTrack.id);
    setCurrentTrackIndex(index);
    setTrack(selectedTrack);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleDeleteItemClicked = async (track: Track) => {
    try {
      const res = await fetch(`/api/tracks/delete-url?id=${track.id}`);
      const { deleteURL, error } = await res.json();

      if (error) throw new Error(error);

      const deleteResponse = await fetch(deleteURL, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) throw new Error('Failed to delete file');

      await fetch(`/api/tracks/${track.id}`, {
        method: 'DELETE',
      });

      setLibrary((prevLibrary) =>
        prevLibrary.filter((item) => item.id !== track.id),
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (!library || library.length === 0) {
    return <p>You haven&apos;t uploaded any audio tracks yet.</p>;
  }

  return (
    <div className="w-full flex-col px-48 py-32">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-16">
        {library.map((track) => (
          <TrackCard
            track={track}
            onSelect={handleTrackSelect}
            onDelete={handleDeleteItemClicked}
            key={track.id}
          />
        ))}
      </div>
    </div>
  );
}
