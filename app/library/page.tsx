'use client';

import React, { useEffect, useContext, useState } from 'react';
import { Track } from '@prisma/client';
import { PlayerContext } from '@/context/PlayerContext';
import { FaThLarge, FaList } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import TrackCard from '../../components/TrackCard';
import TrackListView from '../../components/TrackListView';

export default function Library(): JSX.Element {
  const { status } = useSession();
  const router = useRouter();
  const playerContext = useContext(PlayerContext);
  const [library, setLibrary] = useState<Track[]>([]);
  const [view, setView] = useState<'card' | 'list'>('card');
  const [errorDisplay, setErrordisplay] = useState<string | null>(null); // Error state

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

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
    async function fetchTracks() {
      try {
        const res = await fetch('/api/tracks');

        if (!res.ok) {
          throw new Error('Failed to fetch tracks. Please try again later.');
        }

        const data = await res.json();
        setLibrary(data.tracks);
        setErrordisplay(null); // Clear any previous errors
      } catch (error) {
        setErrordisplay(
          error instanceof Error ? error.message : 'Something went wrong.',
        );
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
    } catch {
      setErrordisplay('Failed to delete the track. Please try again.');
    }
  };

  if (errorDisplay) {
    return (
      <p className="text-red-500 pt-[4.5rem] sm:pt-10 px-8 sm:px-16 lg:px-72 text-center">
        {errorDisplay}
      </p>
    );
  }

  if (!library || library.length === 0) {
    return (
      <p className="pt-[4.5rem] sm:pt-10 px-8 sm:px-16 lg:px-72 text-center">
        You haven&apos;t uploaded any audio tracks yet.
      </p>
    );
  }

  return (
    <div className="w-full pt-[4.5rem] sm:pt-10 px-8 sm:px-16 lg:px-72 py-8">
      {/* Toggle Buttons */}
      <div className="flex justify-end gap-4 mb-6">
        <button
          type="button"
          onClick={() => setView('card')}
          className={`p-2 rounded ${
            view === 'card' ? 'bg-gray-200 dark:bg-gray-700' : ''
          }`}
        >
          <FaThLarge />
        </button>
        <button
          type="button"
          onClick={() => setView('list')}
          className={`p-2 rounded ${
            view === 'list' ? 'bg-gray-200 dark:bg-gray-700' : ''
          }`}
        >
          <FaList />
        </button>
      </div>

      {/* Dynamic View Rendering */}
      {view === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {library.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              onSelect={handleTrackSelect}
              onDelete={handleDeleteItemClicked}
            />
          ))}
        </div>
      ) : (
        <TrackListView
          tracks={library}
          onSelect={handleTrackSelect}
          onDelete={handleDeleteItemClicked}
        />
      )}
    </div>
  );
}
