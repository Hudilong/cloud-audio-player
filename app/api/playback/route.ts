import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@utils/authOptions';
import prisma from '@utils/prisma';

type RepeatMode = 'off' | 'queue' | 'track';

const parseQueueState = (tracksField: unknown) => {
  if (Array.isArray(tracksField)) {
    return {
      queueTrackIds: tracksField.filter((id) => typeof id === 'string'),
      repeatMode: 'off' as RepeatMode,
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
    const repeatModeValue = (tracksField as { repeatMode?: unknown }).repeatMode;
    const repeatMode: RepeatMode =
      repeatModeValue === 'queue' || repeatModeValue === 'track'
        ? repeatModeValue
        : 'off';

    return { queueTrackIds, repeatMode };
  }

  return { queueTrackIds: [] as string[], repeatMode: 'off' as RepeatMode };
};

async function getUserFromSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  return user;
}

export async function GET() {
  const user = await getUserFromSession();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const playbackState = await prisma.playbackState.findUnique({
      where: { userId: user.id },
      include: { track: true },
    });

    if (!playbackState) {
      return NextResponse.json(
        { message: 'No playback state found' },
        { status: 200 },
      );
    }

    const { queueTrackIds, repeatMode } = parseQueueState(
      playbackState.tracks,
    );

    const queueTracks = queueTrackIds.length
      ? await prisma.track.findMany({
          where: { id: { in: queueTrackIds }, userId: user.id },
        })
      : [];

    const queue = queueTrackIds
      .map((id) => queueTracks.find((track) => track.id === id))
      .filter(Boolean);

    return NextResponse.json(
      {
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
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromSession();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    trackId,
    position,
    isPlaying,
    volume,
    isShuffle,
    repeatMode,
    currentTrackIndex,
    queueTrackIds,
  } = body;

  if (!trackId || typeof position !== 'number') {
    return NextResponse.json(
      { error: 'trackId and position are required' },
      { status: 400 },
    );
  }

  if (
    queueTrackIds &&
    (!Array.isArray(queueTrackIds) ||
      !queueTrackIds.every((id: unknown) => typeof id === 'string'))
  ) {
    return NextResponse.json(
      { error: 'queueTrackIds must be an array of strings' },
      { status: 400 },
    );
  }

  const repeatModeValue: RepeatMode =
    repeatMode === 'queue' || repeatMode === 'track' ? repeatMode : 'off';

  try {
    const audio = await prisma.track.findFirst({
      where: { id: trackId, userId: user.id },
    });

    if (!audio) {
      return NextResponse.json(
        { error: 'Access denied to this audio' },
        { status: 403 },
      );
    }

    let validatedQueueIds: string[] = [];
    if (Array.isArray(queueTrackIds) && queueTrackIds.length > 0) {
      const queueTracks = await prisma.track.findMany({
        where: { id: { in: queueTrackIds }, userId: user.id },
        select: { id: true },
      });
      const allowedIds = new Set(queueTracks.map((track) => track.id));
      validatedQueueIds = queueTrackIds.filter((id: string) =>
        allowedIds.has(id),
      );
    }

    await prisma.playbackState.upsert({
      where: { userId: user.id },
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
        userId: user.id,
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

    return NextResponse.json(
      { message: 'Playback state updated' },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
