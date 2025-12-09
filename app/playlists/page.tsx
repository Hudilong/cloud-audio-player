'use client';

import React, { useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PlayerContext } from '@/context/PlayerContext';
import { PlaylistWithTracks } from '../../types/playlist';

export default function PlaylistsPage(): JSX.Element {
  const { status } = useSession();
  const router = useRouter();
  const playerContext = useContext(PlayerContext);

  const [playlists, setPlaylists] = useState<PlaylistWithTracks[]>([]);
  const [playlistName, setPlaylistName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/playlists');
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to load playlists.');

      setPlaylists(data.playlists || []);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load playlists.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPlaylists();
    }
  }, [status]);

  if (!playerContext) {
    throw new Error('PlaylistsPage must be used within a PlayerProvider');
  }

  const {
    setQueue,
    setTrack,
    setCurrentTrackIndex,
    setCurrentTime,
    setIsPlaying,
  } = playerContext;

  const startPlayback = (
    playlist: PlaylistWithTracks,
    targetTrackId?: string,
  ) => {
    const orderedTracks = [...playlist.playlistTracks]
      .sort((a, b) => a.position - b.position)
      .map((item) => item.track);

    if (orderedTracks.length === 0) {
      return;
    }

    const index = targetTrackId
      ? orderedTracks.findIndex((t) => t.id === targetTrackId)
      : 0;
    const safeIndex = index >= 0 ? index : 0;

    setQueue(orderedTracks);
    setCurrentTrackIndex(safeIndex);
    setTrack(orderedTracks[safeIndex]);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playlistName.trim()) {
      setError('Please enter a playlist name.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playlistName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to create playlist.');

      setPlaylists((prev) => [
        { ...data.playlist, playlistTracks: [] },
        ...prev,
      ]);
      setPlaylistName('');
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create playlist.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to delete playlist.');

      setPlaylists((prev) =>
        prev.filter((playlist) => playlist.id !== playlistId),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete playlist.',
      );
    }
  };

  const handleRemoveTrack = async (playlistId: string, trackId: string) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to remove track.');

      if (data.playlist) {
        setPlaylists((prev) =>
          prev.map((playlist) =>
            playlist.id === playlistId ? data.playlist : playlist,
          ),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove track.');
    }
  };

  const handlePlayPlaylist = (playlistId: string) => {
    const playlist = playlists.find((item) => item.id === playlistId);
    if (playlist) {
      startPlayback(playlist);
    }
  };

  const handlePlayTrack = (playlistId: string, trackId: string) => {
    const playlist = playlists.find((item) => item.id === playlistId);
    if (playlist) {
      startPlayback(playlist, trackId);
    }
  };

  const renderPlaylists = () => {
    if (loading) {
      return <p>Loading playlists...</p>;
    }

    if (playlists.length === 0) {
      return (
        <p className="text-center text-gray-600 dark:text-gray-400">
          No playlists yet. Create one to get started.
        </p>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        {playlists.map((playlist) => {
          const orderedTracks = [...playlist.playlistTracks].sort(
            (a, b) => a.position - b.position,
          );

          return (
            <div
              key={playlist.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-soft p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{playlist.name}</h2>
                  <p className="text-sm text-gray-500">
                    {orderedTracks.length}{' '}
                    {orderedTracks.length === 1 ? 'track' : 'tracks'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlayPlaylist(playlist.id)}
                    disabled={orderedTracks.length === 0}
                    className="px-3 py-2 text-sm rounded-md bg-emerald-600 text-white disabled:opacity-60"
                  >
                    Play
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePlaylist(playlist.id)}
                    className="px-3 py-2 text-sm rounded-md border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-4">
                {orderedTracks.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No tracks in this playlist yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {orderedTracks.map((playlistTrack) => (
                      <li
                        key={playlistTrack.id}
                        className="flex items-center justify-between py-3"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {playlistTrack.track.title || 'Untitled track'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {playlistTrack.track.artist || 'Unknown artist'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-sm px-3 py-1 rounded-md border border-gray-300 dark:border-gray-700"
                            onClick={() =>
                              handlePlayTrack(
                                playlist.id,
                                playlistTrack.track.id,
                              )
                            }
                          >
                            Play
                          </button>
                          <button
                            type="button"
                            className="text-sm px-3 py-1 rounded-md border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                            onClick={() =>
                              handleRemoveTrack(
                                playlist.id,
                                playlistTrack.track.id,
                              )
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full pt-[4.5rem] sm:pt-10 px-8 sm:px-16 lg:px-72 py-8">
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-bold">Playlists</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Create playlists and queue them up for playback.
          </p>
          <form
            onSubmit={handleCreatePlaylist}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Playlist name"
              className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-accentLight dark:bg-accentDark text-white rounded-md shadow-soft disabled:opacity-60"
            >
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </form>
          {error && (
            <p className="text-red-500 text-sm" role="alert">
              {error}
            </p>
          )}
        </div>

        {renderPlaylists()}
      </div>
    </div>
  );
}
