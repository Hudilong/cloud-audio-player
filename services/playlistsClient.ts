import type { PlaylistWithTracks } from '../types/playlist';
import { getFriendlyMessage, parseApiError } from '../utils/apiError';

export type ReorderPayload = Array<{ id: string; kind: 'user' | 'featured' }>;

const json = async (res: Response) => {
  const data = await res.json();
  if (!res.ok) {
    const apiError = await parseApiError(res, data);
    throw new Error(getFriendlyMessage(apiError));
  }
  return data;
};

export async function fetchPlaylistsClient(): Promise<PlaylistWithTracks[]> {
  const res = await fetch('/api/playlists');
  const data = await json(res);
  return data.playlists || [];
}

export async function addTrackToPlaylistClient(
  playlistId: string,
  trackId: string,
): Promise<PlaylistWithTracks | null> {
  const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackId }),
  });
  const data = await json(res);
  return data.playlist || null;
}

export async function createPlaylistClient(
  name: string,
): Promise<PlaylistWithTracks> {
  const res = await fetch('/api/playlists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const data = await json(res);
  return { ...data.playlist, playlistTracks: [] };
}

export async function deletePlaylistClient(playlistId: string): Promise<void> {
  const res = await fetch(`/api/playlists/${playlistId}`, {
    method: 'DELETE',
  });
  await json(res);
}

export async function reorderPlaylistTracksClient(
  playlistId: string,
  orderedTracks: ReorderPayload,
): Promise<PlaylistWithTracks | null> {
  const items = orderedTracks.map((entry, index) => ({
    trackId: entry.id,
    position: (index + 1) * 100,
  }));

  const res = await fetch(`/api/playlists/${playlistId}/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  const data = await json(res);
  return data.playlist || null;
}
