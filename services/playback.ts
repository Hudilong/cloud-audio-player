import { LibraryTrack, LibraryTrackKind } from '@app-types/libraryTrack';
import prisma from '@utils/prisma';
import { forbidden, notFound } from '@utils/httpError';

export type RepeatMode = 'off' | 'queue' | 'track';

export type QueueEntry = { id: string; kind: LibraryTrackKind };

export type QueueState = { entries: QueueEntry[]; repeatMode: RepeatMode };

export type PlaybackPayload = {
  trackId: string;
  trackKind?: LibraryTrackKind;
  position: number;
  isPlaying?: boolean;
  volume?: number;
  isShuffle?: boolean;
  repeatMode?: RepeatMode;
  currentTrackIndex?: number;
  queue?: QueueEntry[];
  queueTrackIds?: string[];
};

const normalizeRepeatMode = (value: unknown): RepeatMode =>
  value === 'queue' || value === 'track' ? value : 'off';

const toLibraryTrack = (
  track: {
    id: string;
    title: string | null;
    artist: string | null;
    album: string | null;
    genre: string | null;
    duration: number;
    s3Key: string;
    imageURL: string | null;
    imageBlurhash: string | null;
    userId?: string | null;
    isFeatured?: boolean;
    order?: number;
  },
  kind: LibraryTrackKind,
): LibraryTrack => ({
  ...track,
  kind,
  isFeatured: kind === 'featured' ? true : (track.isFeatured ?? false),
});

export const parseQueueState = (tracksField: unknown): QueueState => {
  if (Array.isArray(tracksField)) {
    return {
      entries: tracksField
        .filter((id) => typeof id === 'string')
        .map((id) => ({ id, kind: 'user' as const })),
      repeatMode: 'off',
    };
  }

  if (tracksField && typeof tracksField === 'object') {
    const repeatMode = normalizeRepeatMode(
      (tracksField as { repeatMode?: unknown }).repeatMode,
    );

    if (Array.isArray((tracksField as { entries?: unknown }).entries)) {
      const entries = (tracksField as { entries: unknown[] }).entries
        .map((entry) => {
          if (!entry || typeof entry !== 'object') return null;
          const id = (entry as { id?: unknown }).id;
          const kind = (entry as { kind?: unknown }).kind;
          if (typeof id !== 'string') return null;
          const normalizedKind: LibraryTrackKind =
            kind === 'featured' ? 'featured' : 'user';
          return { id, kind: normalizedKind };
        })
        .filter(Boolean) as QueueEntry[];

      return { entries, repeatMode };
    }

    if ('queueTrackIds' in tracksField) {
      const queueTrackIds = Array.isArray(
        (tracksField as { queueTrackIds?: unknown }).queueTrackIds,
      )
        ? ((tracksField as { queueTrackIds: unknown[] }).queueTrackIds.filter(
            (id) => typeof id === 'string',
          ) as string[])
        : [];
      return {
        entries: queueTrackIds.map((id) => ({ id, kind: 'user' as const })),
        repeatMode,
      };
    }

    return { entries: [], repeatMode };
  }

  return { entries: [], repeatMode: 'off' };
};

export async function getPlaybackStateForUser(userId: string) {
  const playbackState = await prisma.playbackState.findUnique({
    where: { userId },
    include: { track: true },
  });

  if (!playbackState) {
    return null;
  }

  const { entries, repeatMode } = parseQueueState(playbackState.tracks);

  const queueIds = entries.map((entry) => entry.id);
  const queueTracks = queueIds.length
    ? await prisma.track.findMany({
        where: {
          id: { in: queueIds },
          OR: [{ userId }, { isFeatured: true }],
        },
      })
    : [];

  const queue = entries
    .map((entry) => {
      const match = queueTracks.find((track) => track.id === entry.id);
      if (!match) return null;
      const kind: LibraryTrackKind = match.isFeatured ? 'featured' : 'user';
      return toLibraryTrack(match, kind);
    })
    .filter(Boolean) as LibraryTrack[];

  const currentTrack = playbackState.track
    ? toLibraryTrack(
        playbackState.track,
        playbackState.track.isFeatured ? 'featured' : 'user',
      )
    : null;

  return {
    track: currentTrack,
    trackId: playbackState.trackId,
    trackKind: currentTrack?.kind || 'user',
    position: playbackState.position,
    isPlaying: playbackState.isPlaying,
    volume: playbackState.volume,
    isShuffle: playbackState.shuffle,
    repeatMode,
    currentTrackIndex: playbackState.currentTrackIndex,
    queue,
    updatedAt: playbackState.updatedAt,
  };
}

export async function updatePlaybackStateForUser(
  userId: string,
  payload: PlaybackPayload,
) {
  const {
    trackId,
    trackKind = 'user',
    position,
    isPlaying,
    volume,
    isShuffle,
    repeatMode,
    currentTrackIndex,
    queue,
    queueTrackIds,
  } = payload;

  const repeatModeValue: RepeatMode = repeatMode || 'off';

  if (!trackId) {
    throw forbidden('Track ID is required');
  }

  const audio = await prisma.track.findUnique({
    where: { id: trackId },
  });

  if (!audio || (audio.userId !== userId && !audio.isFeatured)) {
    throw forbidden('Access denied to this track');
  }

  const targetTrack = toLibraryTrack(
    audio,
    audio.isFeatured ? 'featured' : 'user',
  );

  let queueEntries: QueueEntry[] = Array.isArray(queue) ? queue : [];

  if (!queueEntries.length && Array.isArray(queueTrackIds)) {
    queueEntries = queueTrackIds.map((id) => ({ id, kind: 'user' as const }));
  }

  const queueTracks = queueEntries.length
    ? await prisma.track.findMany({
        where: {
          id: { in: queueEntries.map((entry) => entry.id) },
          OR: [{ userId }, { isFeatured: true }],
        },
        select: { id: true, isFeatured: true },
      })
    : [];

  const allowedIds = new Map(queueTracks.map((track) => [track.id, track]));

  const validatedQueueEntries = queueEntries
    .map((entry) => {
      const entryTrack = allowedIds.get(entry.id);
      if (!entryTrack) return null;
      const kind: LibraryTrackKind = entryTrack.isFeatured
        ? 'featured'
        : 'user';
      return { ...entry, kind };
    })
    .filter(Boolean) as QueueEntry[];

  await prisma.playbackState.upsert({
    where: { userId },
    update: {
      trackId: targetTrack.id,
      position,
      isPlaying: typeof isPlaying === 'boolean' ? isPlaying : false,
      volume: typeof volume === 'number' ? volume : 1,
      shuffle: typeof isShuffle === 'boolean' ? isShuffle : false,
      repeat: repeatModeValue !== 'off',
      repeatMode: repeatModeValue,
      currentTrackIndex:
        typeof currentTrackIndex === 'number' ? currentTrackIndex : 0,
      tracks: {
        entries: validatedQueueEntries,
        repeatMode: repeatModeValue,
      },
    },
    create: {
      userId,
      trackId: targetTrack.id,
      position,
      isPlaying: typeof isPlaying === 'boolean' ? isPlaying : false,
      volume: typeof volume === 'number' ? volume : 1,
      shuffle: typeof isShuffle === 'boolean' ? isShuffle : false,
      repeat: repeatModeValue !== 'off',
      repeatMode: repeatModeValue,
      currentTrackIndex:
        typeof currentTrackIndex === 'number' ? currentTrackIndex : 0,
      tracks: {
        entries: validatedQueueEntries,
        repeatMode: repeatModeValue,
      },
    },
  });

  const updated = await getPlaybackStateForUser(userId);
  if (!updated) throw notFound('Playback state not found');
  return updated;
}
