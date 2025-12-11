import prisma from '@utils/prisma';
import { HttpError, badRequest, notFound } from '@utils/httpError';

const TEMP_POSITION_OFFSET = 100000;
const GAP = 100;

export type ReorderItem = { trackId: string; position?: number };

export async function reorderPlaylistForUser(
  userId: string,
  playlistId: string,
  items: ReorderItem[],
) {
  const orderedTrackIds = items.map((item) => item.trackId);

  const playlist = await prisma.playlist.findFirst({
    where: { id: playlistId, userId },
    include: {
      playlistTracks: {
        select: { id: true, trackId: true, position: true },
      },
    },
  });

  if (!playlist) {
    throw notFound('Playlist not found');
  }

  const existingTrackIds = playlist.playlistTracks.map((pt) => pt.trackId);
  const allPresent =
    orderedTrackIds.length === existingTrackIds.length &&
    orderedTrackIds.every((id) => existingTrackIds.includes(id));

  if (!allPresent) {
    throw badRequest(
      'items must include the same tracks currently in the playlist (trackId mismatch)',
    );
  }

  const trackIdToPlaylistTrackId = playlist.playlistTracks.reduce(
    (acc, pt) => {
      acc[pt.trackId] = pt.id;
      return acc;
    },
    {} as Record<string, string>,
  );

  const trackIdToPosition: Record<string, number> = {};
  items.forEach((item, index) => {
    const fromPayload =
      typeof item.position === 'number' && !Number.isNaN(item.position)
        ? item.position
        : null;
    trackIdToPosition[item.trackId] =
      fromPayload !== null ? fromPayload : (index + 1) * GAP;
  });

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await Promise.all(
        orderedTrackIds.map((trackId, index) =>
          tx.playlistTrack.update({
            where: { id: trackIdToPlaylistTrackId[trackId] },
            data: { position: TEMP_POSITION_OFFSET + index },
          }),
        ),
      );

      await Promise.all(
        orderedTrackIds.map((trackId, index) =>
          tx.playlistTrack.update({
            where: { id: trackIdToPlaylistTrackId[trackId] },
            data: { position: trackIdToPosition[trackId] ?? (index + 1) * GAP },
          }),
        ),
      );

      await tx.playlist.update({
        where: { id: playlistId },
        data: { updatedAt: new Date() },
      });

      return tx.playlist.findUnique({
        where: { id: playlistId },
        include: {
          playlistTracks: {
            orderBy: { position: 'asc' },
            include: { track: true },
          },
        },
      });
    });

    return updated;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new Error('Error reordering playlist');
  }
}
