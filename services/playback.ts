import prisma from '@utils/prisma';
import { forbidden, notFound } from '@utils/httpError';

export type RepeatMode = 'off' | 'queue' | 'track';

export type QueueState = { queueTrackIds: string[]; repeatMode: RepeatMode };

export type PlaybackPayload = {
  trackId: string;
  position: number;
  isPlaying?: boolean;
  volume?: number;
  isShuffle?: boolean;
  repeatMode?: RepeatMode;
  currentTrackIndex?: number;
  queueTrackIds?: string[];
};

export const parseQueueState = (tracksField: unknown): QueueState => {
  if (Array.isArray(tracksField)) {
    return {
      queueTrackIds: tracksField.filter((id) => typeof id === 'string'),
      repeatMode: 'off',
    };
  }

  if (
    tracksField &&
    typeof tracksField === 'object' &&
    'queueTrackIds' in tracksField
  ) {
    const queueTrackIds = Array.isArray(
      (tracksField as { queueTrackIds?: unknown }).queueTrackIds,
    )
      ? ((tracksField as { queueTrackIds: unknown[] }).queueTrackIds.filter(
          (id) => typeof id === 'string',
        ) as string[])
      : [];
    const repeatModeValue = (tracksField as { repeatMode?: unknown })
      .repeatMode;
    const repeatMode: RepeatMode =
      repeatModeValue === 'queue' || repeatModeValue === 'track'
        ? repeatModeValue
        : 'off';

    return { queueTrackIds, repeatMode };
  }

  return { queueTrackIds: [], repeatMode: 'off' };
};

export async function getPlaybackStateForUser(userId: string) {
  const playbackState = await prisma.playbackState.findUnique({
    where: { userId },
    include: { track: true },
  });

  if (!playbackState) {
    return null;
  }

  const { queueTrackIds, repeatMode } = parseQueueState(playbackState.tracks);

  const queueTracks = queueTrackIds.length
    ? await prisma.track.findMany({
        where: { id: { in: queueTrackIds }, userId },
      })
    : [];

  const queue = queueTrackIds
    .map((id) => queueTracks.find((track) => track.id === id))
    .filter(Boolean);

  return {
    track: playbackState.track,
    trackId: playbackState.trackId,
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
    position,
    isPlaying,
    volume,
    isShuffle,
    repeatMode,
    currentTrackIndex,
    queueTrackIds,
  } = payload;

  const repeatModeValue: RepeatMode = repeatMode || 'off';

  const audio = await prisma.track.findFirst({
    where: { id: trackId, userId },
  });

  if (!audio) {
    throw forbidden('Access denied to this audio');
  }

  let validatedQueueIds: string[] = [];
  if (Array.isArray(queueTrackIds) && queueTrackIds.length > 0) {
    const queueTracks = await prisma.track.findMany({
      where: { id: { in: queueTrackIds }, userId },
      select: { id: true },
    });
    const allowedIds = new Set(queueTracks.map((track) => track.id));
    validatedQueueIds = queueTrackIds.filter((id: string) =>
      allowedIds.has(id),
    );
  }

  await prisma.playbackState.upsert({
    where: { userId },
    update: {
      trackId,
      position,
      isPlaying: typeof isPlaying === 'boolean' ? isPlaying : false,
      volume: typeof volume === 'number' ? volume : 1,
      shuffle: typeof isShuffle === 'boolean' ? isShuffle : false,
      repeat: repeatModeValue !== 'off',
      repeatMode: repeatModeValue,
      currentTrackIndex:
        typeof currentTrackIndex === 'number' ? currentTrackIndex : 0,
      tracks: {
        queueTrackIds: validatedQueueIds,
        repeatMode: repeatModeValue,
      },
    },
    create: {
      userId,
      trackId,
      position,
      isPlaying: typeof isPlaying === 'boolean' ? isPlaying : false,
      volume: typeof volume === 'number' ? volume : 1,
      shuffle: typeof isShuffle === 'boolean' ? isShuffle : false,
      repeat: repeatModeValue !== 'off',
      repeatMode: repeatModeValue,
      currentTrackIndex:
        typeof currentTrackIndex === 'number' ? currentTrackIndex : 0,
      tracks: {
        queueTrackIds: validatedQueueIds,
        repeatMode: repeatModeValue,
      },
    },
  });

  const updated = await getPlaybackStateForUser(userId);
  if (!updated) throw notFound('Playback state not found');
  return updated;
}
