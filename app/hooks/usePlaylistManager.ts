'use client';

import { useCallback, useEffect, useState } from 'react';
import { Track } from '@prisma/client';
import type { PlaylistWithTracks } from '../../types/playlist';

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

const defaultPlaylistFilter = { id: null, name: 'Library' };

export function usePlaylistManager(status: SessionStatus) {
  const [playlists, setPlaylists] = useState<PlaylistWithTracks[]>([]);
  const [activePlaylistFilter, setActivePlaylistFilter] = useState<{
    id: string | null;
    name: string;
  }>(defaultPlaylistFilter);
  const [viewMode, setViewMode] = useState<'songs' | 'playlists'>('songs');
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistError, setPlaylistError] = useState<string | null>(null);
  const [playlistName, setPlaylistName] = useState('');
  const [trackToAdd, setTrackToAdd] = useState<Track | null>(null);
  const [reorderingPlaylistId, setReorderingPlaylistId] = useState<
    string | null
  >(null);

  const fetchPlaylists = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPlaylists();
    }
  }, [fetchPlaylists, status]);

  const getPlaylistTracks = useCallback(
    (playlistId: string) => {
      const playlist = playlists.find((p) => p.id === playlistId);
      if (!playlist) return [];
      return [...playlist.playlistTracks]
        .sort((a, b) => a.position - b.position)
        .map((item) => item.track);
    },
    [playlists],
  );

  const openPlaylistModal = useCallback((selectedTrack: Track) => {
    setTrackToAdd(selectedTrack);
    setPlaylistModalOpen(true);
    setPlaylistError(null);
  }, []);

  const closePlaylistModal = useCallback(() => {
    setPlaylistModalOpen(false);
    setPlaylistName('');
    setPlaylistError(null);
    setTrackToAdd(null);
  }, []);

  const addTrackToPlaylist = useCallback(
    async (playlistId: string, trackId: string) => {
      setPlaylistLoading(true);
      try {
        const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackId }),
        });

        const data = await res.json();

        if (!res.ok)
          throw new Error(data.error || 'Failed to add to playlist.');

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

        closePlaylistModal();
      } catch (error) {
        setPlaylistError(
          error instanceof Error ? error.message : 'Failed to add to playlist.',
        );
      } finally {
        setPlaylistLoading(false);
      }
    },
    [closePlaylistModal],
  );

  const createPlaylist = useCallback(async () => {
    if (!playlistName.trim()) {
      setPlaylistError('Please enter a playlist name.');
      return null;
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
      setCreatePlaylistOpen(false);

      if (trackToAdd) {
        await addTrackToPlaylist(newPlaylist.id, trackToAdd.id);
      } else {
        setPlaylistModalOpen(false);
      }

      return newPlaylist;
    } catch (error) {
      setPlaylistError(
        error instanceof Error ? error.message : 'Failed to create playlist.',
      );
      return null;
    } finally {
      setPlaylistLoading(false);
    }
  }, [addTrackToPlaylist, playlistName, trackToAdd]);

  const deletePlaylist = useCallback(async (playlistId: string) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete playlist.');

      setPlaylists((prev) =>
        prev.filter((playlist) => playlist.id !== playlistId),
      );

      return true;
    } catch (error) {
      setPlaylistError(
        error instanceof Error ? error.message : 'Failed to delete playlist.',
      );
      return false;
    }
  }, []);

  const reorderPlaylistTracks = useCallback(
    async (playlistId: string, orderedTrackIds: string[]) => {
      setReorderingPlaylistId(playlistId);
      try {
        const items = orderedTrackIds.map((trackId, index) => ({
          trackId,
          position: (index + 1) * 100,
        }));

        const res = await fetch(`/api/playlists/${playlistId}/reorder`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to reorder playlist.');
        }

        if (data.playlist) {
          setPlaylists((prev) =>
            prev.map((playlist) =>
              playlist.id === data.playlist.id ? data.playlist : playlist,
            ),
          );
        }

        return true;
      } catch (error) {
        setPlaylistError(
          error instanceof Error
            ? error.message
            : 'Failed to reorder playlist.',
        );
        return false;
      } finally {
        setReorderingPlaylistId(null);
      }
    },
    [],
  );

  const removeTrackFromPlaylists = useCallback((trackId: string) => {
    setPlaylists((prev) =>
      prev.map((playlist) => ({
        ...playlist,
        playlistTracks: playlist.playlistTracks.filter(
          (pt) => pt.track.id !== trackId,
        ),
      })),
    );
  }, []);

  return {
    playlists,
    viewMode,
    setViewMode,
    activePlaylistFilter,
    setActivePlaylistFilter,
    playlistModalOpen,
    createPlaylistOpen,
    playlistLoading,
    playlistError,
    playlistName,
    trackToAdd,
    setPlaylistName,
    setCreatePlaylistOpen,
    openPlaylistModal,
    closePlaylistModal,
    fetchPlaylists,
    getPlaylistTracks,
    addTrackToPlaylist,
    reorderPlaylistTracks,
    createPlaylist,
    deletePlaylist,
    removeTrackFromPlaylists,
    defaultPlaylistFilter,
    setPlaylistError,
    reorderingPlaylistId,
  };
}
