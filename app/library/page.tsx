'use client';

import React, { useEffect, useContext, useState } from 'react';
import { Track } from '@prisma/client';
import { PlayerContext } from '@/context/PlayerContext';
import { FaThLarge, FaList } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import TrackCard from '../../components/TrackCard';
import TrackListView from '../../components/TrackListView';
import PlaylistPickerModal from '../../components/PlaylistPickerModal';
import { PlaylistWithTracks } from '../../types/playlist';

export default function Library(): JSX.Element {
  const { status } = useSession();
  const router = useRouter();
  const playerContext = useContext(PlayerContext);
  const [library, setLibrary] = useState<Track[]>([]);
  const [view, setView] = useState<'card' | 'list'>('list');
  const [errorDisplay, setErrordisplay] = useState<string | null>(null); // Error state
  const [playlists, setPlaylists] = useState<PlaylistWithTracks[]>([]);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistError, setPlaylistError] = useState<string | null>(null);
  const [playlistName, setPlaylistName] = useState('');
  const [trackToAdd, setTrackToAdd] = useState<Track | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchPlaylists() {
      try {
        const res = await fetch('/api/playlists');
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to load playlists.');

        setPlaylists(data.playlists || []);
        setPlaylistError(null);
      } catch (error) {
        setPlaylistError(
          error instanceof Error ? error.message : 'Failed to load playlists.',
        );
      }
    }

    if (status === 'authenticated') {
      fetchPlaylists();
    }
  }, [status]);

  if (!playerContext) {
    throw new Error('Library must be used within a PlayerProvider');
  }

  const {
    setTrack,
    setCurrentTime,
    setIsPlaying,
    setCurrentTrackIndex,
    setQueue,
  } = playerContext;

  // Fetch user tracks
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

  const openPlaylistModal = (selectedTrack: Track) => {
    setTrackToAdd(selectedTrack);
    setPlaylistModalOpen(true);
    setPlaylistError(null);
  };

  const addTrackToPlaylist = async (playlistId: string, trackId: string) => {
    setPlaylistLoading(true);
    try {
      const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to add to playlist.');

      if (data.playlist) {
        setPlaylists((prev) => {
          const exists = prev.some(
            (playlist) => playlist.id === data.playlist.id,
          );
          if (exists) {
            return prev.map((playlist) =>
              playlist.id === data.playlist.id ? data.playlist : playlist,
            );
          }
          return [data.playlist, ...prev];
        });
      }

      setPlaylistModalOpen(false);
      setPlaylistName('');
      setTrackToAdd(null);
      setPlaylistError(null);
    } catch (error) {
      setPlaylistError(
        error instanceof Error ? error.message : 'Failed to add to playlist.',
      );
    } finally {
      setPlaylistLoading(false);
    }
  };

  const handleSelectPlaylist = (playlistId: string) => {
    if (trackToAdd) {
      addTrackToPlaylist(playlistId, trackToAdd.id);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      setPlaylistError('Please enter a playlist name.');
      return;
    }

    setPlaylistLoading(true);
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playlistName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to create playlist.');

      const newPlaylist: PlaylistWithTracks = {
        ...data.playlist,
        playlistTracks: [],
      };

      setPlaylists((prev) => [newPlaylist, ...prev]);
      setPlaylistError(null);
      setPlaylistName('');

      if (trackToAdd) {
        await addTrackToPlaylist(newPlaylist.id, trackToAdd.id);
      } else {
        setPlaylistModalOpen(false);
      }
    } catch (error) {
      setPlaylistError(
        error instanceof Error ? error.message : 'Failed to create playlist.',
      );
    } finally {
      setPlaylistLoading(false);
    }
  };

  const closePlaylistModal = () => {
    setPlaylistModalOpen(false);
    setPlaylistName('');
    setPlaylistError(null);
    setTrackToAdd(null);
  };

  const handleTrackSelect = (selectedTrack: Track) => {
    setQueue(library);
    const index = library.findIndex((track) => track.id === selectedTrack.id);
    setCurrentTrackIndex(index);
    setTrack(selectedTrack);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleAddTrackToQueue = (selectedTrack: Track) => {
    setQueue((prevQueue) => [...prevQueue, selectedTrack]);
  };

  const handlePlayNext = (selectedTrack: Track) => {
    setQueue((prevQueue) => {
      // Find the currently playing track index (assumed to be the first in the queue)
      const currentPlayingIndex = 0;

      // Create a new queue with everything before the currently playing track and the selected track as the next
      const newQueue = [
        prevQueue[currentPlayingIndex], // Keep the currently playing track
        selectedTrack, // Insert the selected track to play next
        ...prevQueue.slice(currentPlayingIndex + 1), // Keep the rest of the queue
      ].filter((track, index) => track.id !== selectedTrack.id || index === 1);

      return newQueue;
    });
  };

  const handleAddToPlaylist = (selectedTrack: Track) => {
    openPlaylistModal(selectedTrack);
  };

  const handleDeleteTrack = async (selectedTrack: Track) => {
    try {
      const res = await fetch(`/api/tracks/delete-url?id=${selectedTrack.id}`);
      const { deleteURL, error } = await res.json();

      if (error) throw new Error(error);

      const deleteResponse = await fetch(deleteURL, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) throw new Error('Failed to delete file');

      await fetch(`/api/tracks/${selectedTrack.id}`, {
        method: 'DELETE',
      });

      setLibrary((prevLibrary) =>
        prevLibrary.filter((item) => item.id !== selectedTrack.id),
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
          onClick={() => setView('list')}
          className={`p-2 rounded ${
            view === 'list' ? 'bg-gray-200 dark:bg-gray-700' : ''
          }`}
        >
          <FaList />
        </button>
        <button
          type="button"
          onClick={() => setView('card')}
          className={`p-2 rounded ${
            view === 'card' ? 'bg-gray-200 dark:bg-gray-700' : ''
          }`}
        >
          <FaThLarge />
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
              onDelete={handleDeleteTrack}
              onAddToQueue={handleAddTrackToQueue}
              onPlayNext={handlePlayNext}
              onAddToPlaylist={handleAddToPlaylist}
            />
          ))}
        </div>
      ) : (
        <TrackListView
          tracks={library}
          onSelect={handleTrackSelect}
          onDelete={handleDeleteTrack}
          onAddToQueue={handleAddTrackToQueue}
          onPlayNext={handlePlayNext}
          onAddToPlaylist={handleAddToPlaylist}
        />
      )}

      <PlaylistPickerModal
        isOpen={playlistModalOpen}
        playlists={playlists}
        trackTitle={trackToAdd?.title || trackToAdd?.s3Key}
        newPlaylistName={playlistName}
        loading={playlistLoading}
        error={playlistError}
        onClose={closePlaylistModal}
        onSelectPlaylist={handleSelectPlaylist}
        onCreatePlaylist={handleCreatePlaylist}
        onPlaylistNameChange={setPlaylistName}
      />
    </div>
  );
}
