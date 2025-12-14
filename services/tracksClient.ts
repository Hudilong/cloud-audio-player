import { Track } from '@prisma/client';
import { LibraryTrack } from '@app-types/libraryTrack';
import { getFriendlyMessage, parseApiError } from '@utils/apiError';

type FetchTracksResult = {
  tracks: LibraryTrack[];
  nextCursor: string | null;
};

const normalizeTrack = (track: Track): LibraryTrack => ({
  ...track,
  isFeatured: Boolean((track as { isFeatured?: boolean }).isFeatured),
  kind: (track as { isFeatured?: boolean }).isFeatured ? 'featured' : 'user',
});

export async function fetchLibraryTracks(
  cursor?: string | null,
  limit = 30,
): Promise<FetchTracksResult> {
  const params = new URLSearchParams();
  params.set('limit', limit.toString());
  if (cursor) params.set('cursor', cursor);

  const res = await fetch(`/api/tracks?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) {
    const apiError = await parseApiError(res, data);
    throw new Error(getFriendlyMessage(apiError));
  }

  const normalized = (data.tracks || []).map((track: Track) =>
    normalizeTrack(track),
  );

  return {
    tracks: normalized,
    nextCursor: data.nextCursor || null,
  };
}

type UpdateTrackPayload = Partial<
  Pick<
    Track,
    | 'title'
    | 'artist'
    | 'album'
    | 'genre'
    | 'duration'
    | 's3Key'
    | 'imageURL'
    | 'imageBlurhash'
  >
>;

export async function updateTrack(
  trackId: string,
  payload: UpdateTrackPayload,
): Promise<LibraryTrack> {
  const res = await fetch(`/api/tracks/${trackId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const apiError = await parseApiError(res, data);
    throw new Error(getFriendlyMessage(apiError));
  }

  const raw = data.track || payload;
  return normalizeTrack({ ...(raw as Track), id: trackId });
}

export async function deleteTrack(trackId: string) {
  const res = await fetch(`/api/tracks/${trackId}`, {
    method: 'DELETE',
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const apiError = await parseApiError(res, data);
    throw new Error(getFriendlyMessage(apiError));
  }
  return true;
}

export async function fetchTrackOrder({ shuffle = false } = {}) {
  const res = await fetch(`/api/tracks/order?shuffle=${shuffle}`);
  const data = await res.json();
  if (!res.ok) {
    const apiError = await parseApiError(res, data);
    throw new Error(getFriendlyMessage(apiError));
  }

  if (!Array.isArray(data.ids)) return [];
  return data.ids.filter((id: unknown) => typeof id === 'string') as string[];
}

export async function fetchTrackSummaries(ids: string[]) {
  if (!ids.length) return [];
  const params = new URLSearchParams();
  ids.forEach((id) => params.append('id', id));

  const res = await fetch(`/api/tracks/batch?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) {
    const apiError = await parseApiError(res, data);
    throw new Error(getFriendlyMessage(apiError));
  }

  const normalized = (data.tracks || []).map((track: Track) =>
    normalizeTrack(track),
  );
  return normalized;
}
