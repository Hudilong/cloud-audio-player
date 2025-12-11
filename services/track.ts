import prisma from '@utils/prisma';
import { notFound } from '@utils/httpError';
import { TrackCreateBody } from '../apiSchemas';

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

export async function listTracksForUser(userId: string) {
  const tracks = await prisma.track.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  return tracks;
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
