import prisma from '@utils/prisma';
import { notFound } from '@utils/httpError';
import { TrackCreateBody } from '@utils/apiSchemas';

export async function createTrackForUser(
  userId: string,
  data: TrackCreateBody,
) {
  const track = await prisma.track.create({
    data: {
      ...data,
      imageURL: data.imageURL || null,
      imageBlurhash: data.imageBlurhash || null,
      userId,
    },
  });
  return track;
}

export async function listTracksForUser(
  userId: string,
  options?: { cursor?: string | null; limit?: number },
) {
  const take = Math.min(Math.max(options?.limit || 30, 1), 100);
  const cursor = options?.cursor
    ? {
        id: options.cursor,
      }
    : undefined;

  const tracks = await prisma.track.findMany({
    where: {
      userId,
    },
    take,
    cursor,
    skip: cursor ? 1 : 0,
    orderBy: [
      {
        createdAt: 'desc',
      },
      {
        id: 'desc',
      },
    ],
  });

  const nextCursor =
    tracks.length === take ? tracks[tracks.length - 1]?.id : null;

  return { tracks, nextCursor };
}

export async function updateTrackForUser(
  userId: string,
  trackId: string,
  data: TrackCreateBody,
) {
  const track = await prisma.track.findFirst({
    where: { id: trackId, userId },
  });

  if (!track) {
    throw notFound('Track not found');
  }

  return prisma.track.update({
    data: {
      ...data,
      imageURL: data.imageURL || null,
      imageBlurhash: data.imageBlurhash || null,
      userId,
    },
    where: { id: trackId },
  });
}

export async function getTrackForUser(userId: string, trackId: string) {
  const track = await prisma.track.findFirst({
    where: {
      id: trackId,
      userId,
    },
  });

  if (!track) {
    throw notFound('Track not found');
  }

  return track;
}

export async function deleteTrackForUser(userId: string, trackId: string) {
  const track = await prisma.track.findFirst({
    where: { id: trackId, userId },
  });

  if (!track) {
    throw notFound('Track not found');
  }

  await prisma.$transaction(async (tx) => {
    await tx.playlistTrack.deleteMany({
      where: { trackId },
    });

    await tx.track.delete({
      where: { id: trackId },
    });
  });

  return track;
}

export async function getTrackOrderForUser(userId: string) {
  const tracks = await prisma.track.findMany({
    where: { userId },
    select: { id: true },
    orderBy: [
      {
        createdAt: 'desc',
      },
      {
        id: 'desc',
      },
    ],
  });

  return tracks.map((track) => track.id);
}

export async function getTracksAccessibleByUser(userId: string, ids: string[]) {
  if (!ids.length) return [];

  const uniqueIds = Array.from(new Set(ids));

  return prisma.track.findMany({
    where: {
      id: { in: uniqueIds },
      OR: [{ userId }, { isFeatured: true }],
    },
  });
}
