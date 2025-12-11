import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@utils/prisma';
import { authOptions } from '@utils/authOptions';

const TEMP_POSITION_OFFSET = 100000;

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getUserFromSession();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { items } = await request.json();

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: 'items must be a non-empty array' },
      { status: 400 },
    );
  }

  const orderedTrackIds: string[] = items.map(
    (item: { trackId: string }) => item.trackId,
  );

  const playlist = await prisma.playlist.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      playlistTracks: {
        select: { id: true, trackId: true, position: true },
      },
    },
  });

  if (!playlist) {
    return NextResponse.json(
      { error: 'Playlist not found' },
      { status: 404 },
    );
  }

  const existingTrackIds = playlist.playlistTracks.map((pt) => pt.trackId);
  const allPresent =
    orderedTrackIds.length === existingTrackIds.length &&
    orderedTrackIds.every((id) => existingTrackIds.includes(id));

  if (!allPresent) {
    return NextResponse.json(
      {
        error:
          'items must include the same tracks currently in the playlist (trackId mismatch)',
      },
      { status: 400 },
    );
  }

  const trackIdToPlaylistTrackId = playlist.playlistTracks.reduce(
    (acc, pt) => {
      acc[pt.trackId] = pt.id;
      return acc;
    },
    {} as Record<string, string>,
  );

  const GAP = 100;
  const trackIdToPosition: Record<string, number> = {};
  items.forEach((item: { trackId: string; position?: number }, index: number) => {
    const fromPayload =
      typeof item.position === 'number' && !Number.isNaN(item.position)
        ? item.position
        : null;
    trackIdToPosition[item.trackId] =
      fromPayload !== null ? fromPayload : (index + 1) * GAP;
  });

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Step 1: move to temp positions to avoid unique conflicts
      await Promise.all(
        orderedTrackIds.map((trackId, index) =>
          tx.playlistTrack.update({
            where: { id: trackIdToPlaylistTrackId[trackId] },
            data: { position: TEMP_POSITION_OFFSET + index },
          }),
        ),
      );

      // Step 2: set final positions with gap strategy
      await Promise.all(
        orderedTrackIds.map((trackId, index) =>
          tx.playlistTrack.update({
            where: { id: trackIdToPlaylistTrackId[trackId] },
            data: { position: trackIdToPosition[trackId] ?? (index + 1) * GAP },
          }),
        ),
      );

      await tx.playlist.update({
        where: { id: params.id },
        data: { updatedAt: new Date() },
      });

      return tx.playlist.findUnique({
        where: { id: params.id },
        include: {
          playlistTracks: {
            orderBy: { position: 'asc' },
            include: { track: true },
          },
        },
      });
    });

    return NextResponse.json(
      { message: 'Playlist reordered', playlist: updated },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: 'Error reordering playlist' },
      { status: 500 },
    );
  }
}
