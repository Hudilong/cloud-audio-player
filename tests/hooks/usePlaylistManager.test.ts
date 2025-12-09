import type { Track } from '@prisma/client';
import { renderHook, act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlaylistManager } from '@/hooks/usePlaylistManager';
import type { PlaylistWithTracks } from '../../types/playlist';

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

const now = new Date();

const buildTrack = (id: string): Track => ({
  id,
  title: `Track ${id}`,
  artist: 'Artist',
  album: 'Album',
  genre: 'Genre',
  duration: 180,
  imageURL: null,
  s3Key: `s3-${id}`,
  userId: 'user-1',
  createdAt: now,
  updatedAt: now,
});

const buildPlaylist = (
  id: string,
  tracks: Track[] = [],
): PlaylistWithTracks => ({
  id,
  name: `Playlist ${id}`,
  userId: 'user-1',
  createdAt: now,
  updatedAt: now,
  playlistTracks: tracks.map((track, index) => ({
    id: `pt-${id}-${index}`,
    position: index,
    track,
  })),
});

describe('usePlaylistManager', () => {
  const originalFetch = global.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('loads playlists once a user is authenticated', async () => {
    const playlists = [buildPlaylist('one', [buildTrack('t-1')])];
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ playlists }),
    });

    const { result } = renderHook(() => usePlaylistManager('authenticated'));

    await waitFor(() => expect(result.current.playlists).toHaveLength(1));

    expect(fetchMock).toHaveBeenCalledWith('/api/playlists');
    expect(result.current.playlists[0].playlistTracks[0].track.id).toBe('t-1');
    expect(result.current.playlistError).toBeNull();
  });

  it('captures playlist fetch failures', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server unavailable' }),
    });

    const { result } = renderHook(() => usePlaylistManager('authenticated'));

    await waitFor(() =>
      expect(result.current.playlistError).toBe('Server unavailable'),
    );
    expect(result.current.playlists).toHaveLength(0);
  });

  it('creates a playlist, adds the pending track, and closes the modal', async () => {
    const trackToAdd = buildTrack('t-new');

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          playlist: {
            id: 'p-new',
            name: 'New Playlist',
            userId: 'user-1',
            createdAt: now,
            updatedAt: now,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          playlist: buildPlaylist('p-new', [trackToAdd]),
        }),
      });

    const { result } = renderHook(() => usePlaylistManager('unauthenticated'));

    act(() => {
      result.current.openPlaylistModal(trackToAdd);
      result.current.setPlaylistName('  Roadtrip ');
    });

    await act(async () => {
      await result.current.createPlaylist();
    });

    await waitFor(() =>
      expect(result.current.playlists[0].playlistTracks[0].track.id).toBe(
        trackToAdd.id,
      ),
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.playlistModalOpen).toBe(false);
    expect(result.current.trackToAdd).toBeNull();
    expect(result.current.playlistName).toBe('');
    expect(result.current.playlistError).toBeNull();
  });

  it('requires a playlist name before attempting creation', async () => {
    const { result } = renderHook(() => usePlaylistManager('unauthenticated'));

    await act(async () => {
      const created = await result.current.createPlaylist();
      expect(created).toBeNull();
    });

    expect(result.current.playlistError).toBe('Please enter a playlist name.');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
