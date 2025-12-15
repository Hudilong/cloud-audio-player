'use client';

import { useCallback, useEffect, useState } from 'react';
import { LibraryTrack } from '@app-types/libraryTrack';
import type { PlaylistWithTracks } from '../../types/playlist';
import { getFriendlyMessage } from '../../utils/apiError';
import { useToast } from '../context/ToastContext';
import {
  addTrackToPlaylistClient,
  createPlaylistClient,
  deletePlaylistClient,
  fetchPlaylistsClient,
  reorderPlaylistTracksClient,
} from '../../services/playlistsClient';

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

const defaultPlaylistFilter = { id: null, name: 'Library' };

export function usePlaylistManager(status: SessionStatus) {
  const { notify } = useToast();
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
  const [trackToAdd, setTrackToAdd] = useState<LibraryTrack | null>(null);
  const [reorderingPlaylistId, setReorderingPlaylistId] = useState<
    string | null
  >(null);

  const fetchPlaylists = useCallback(async () => {
    try {
      const playlistsResponse = await fetchPlaylistsClient();
      setPlaylists(playlistsResponse);
      setPlaylistError(null);
    } catch (error) {
      const message = getFriendlyMessage(error as Error);
      setPlaylistError(message);
      notify(message, { variant: 'error' });
    }
  }, [notify]);

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
        .map((item) => ({
          ...item.track,
          kind: item.track.isFeatured
            ? ('featured' as const)
            : ('user' as const),
        }));
    },
    [playlists],
  );

  const openPlaylistModal = useCallback((selectedTrack: LibraryTrack) => {
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
        const playlist = await addTrackToPlaylistClient(playlistId, trackId);

        if (playlist) {
          setPlaylists((prev) => {
            const exists = prev.some((pl) => pl.id === playlist.id);
            if (exists) {
              return prev.map((pl) => (pl.id === playlist.id ? playlist : pl));
            }
            return [playlist, ...prev];
          });
        }

        closePlaylistModal();
      } catch (error) {
        const message = getFriendlyMessage(error as Error);
        setPlaylistError(message);
        notify(message, { variant: 'error' });
      } finally {
        setPlaylistLoading(false);
      }
    },
    [closePlaylistModal, notify],
  );

  const createPlaylist = useCallback(async () => {
    if (!playlistName.trim()) {
      setPlaylistError('Please enter a playlist name.');
      return null;
    }

    setPlaylistLoading(true);
    try {
      const newPlaylist = await createPlaylistClient(playlistName.trim());

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
      const message = getFriendlyMessage(error as Error);
      setPlaylistError(message);
      notify(message, { variant: 'error' });
      return null;
    } finally {
      setPlaylistLoading(false);
    }
  }, [addTrackToPlaylist, notify, playlistName, trackToAdd]);

  const deletePlaylist = useCallback(
    async (playlistId: string) => {
      try {
        await deletePlaylistClient(playlistId);
        setPlaylists((prev) =>
          prev.filter((playlist) => playlist.id !== playlistId),
        );

        return true;
      } catch (error) {
        const message = getFriendlyMessage(error as Error);
        setPlaylistError(message);
        notify(message, { variant: 'error' });
        return false;
      }
    },
    [notify],
  );

  const reorderPlaylistTracks = useCallback(
    async (
      playlistId: string,
      orderedTracks: Array<{ id: string; kind: 'user' | 'featured' }>,
    ) => {
      setReorderingPlaylistId(playlistId);
      try {
        const playlist = await reorderPlaylistTracksClient(
          playlistId,
          orderedTracks,
        );

        if (playlist) {
          setPlaylists((prev) =>
            prev.map((pl) => (pl.id === playlist.id ? playlist : pl)),
          );
        }

        return true;
      } catch (error) {
        const message = getFriendlyMessage(error as Error);
        setPlaylistError(message);
        notify(message, { variant: 'error' });
        return false;
      } finally {
        setReorderingPlaylistId(null);
      }
    },
    [notify],
  );

  const removeTrackFromPlaylists = useCallback((trackId: string) => {
    setPlaylists((prev) =>
      prev.map((playlist) => ({
        ...playlist,
        playlistTracks: playlist.playlistTracks.filter(
          (pt) => pt.track?.id !== trackId,
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
