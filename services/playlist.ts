import prisma from '@utils/prisma';
import { HttpError, badRequest, notFound } from '@utils/httpError';

const TEMP_POSITION_OFFSET = 100000;
const GAP = 100;

export type ReorderItem = {
  trackId: string;
  position?: number;
};

export async function reorderPlaylistForUser(
  userId: string,
  playlistId: string,
  items: ReorderItem[],
) {
  const playlist = await prisma.playlist.findFirst({
    where: { id: playlistId, userId },
    include: {
      playlistTracks: {
        select: {
          id: true,
          trackId: true,
          position: true,
        },
      },
    },
  });

  if (!playlist) {
    throw notFound('Playlist not found');
  }

  const existingIds = playlist.playlistTracks.map((pt) => pt.trackId);
  const orderedIds = items.map((item) => item.trackId);
  const allPresent =
    orderedIds.length === existingIds.length &&
    orderedIds.every((key) => existingIds.includes(key));

  if (!allPresent) {
    throw badRequest(
      'items must include the same tracks currently in the playlist (trackId/kind mismatch)',
    );
  }

  const entryKeyToPlaylistTrackId = playlist.playlistTracks.reduce(
    (acc, pt) => {
      acc[pt.trackId] = pt.id;
      return acc;
    },
    {} as Record<string, string>,
  );

  const entryKeyToPosition: Record<string, number> = {};
  orderedIds.forEach((id, index) => {
    const fromPayload =
      typeof items[index]?.position === 'number' &&
      !Number.isNaN(items[index]?.position as number)
        ? (items[index]?.position as number)
        : null;
    entryKeyToPosition[id] =
      fromPayload !== null ? fromPayload : (index + 1) * GAP;
  });

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await Promise.all(
        orderedIds.map((id, index) =>
          tx.playlistTrack.update({
            where: { id: entryKeyToPlaylistTrackId[id] },
            data: { position: TEMP_POSITION_OFFSET + index },
          }),
        ),
      );

      await Promise.all(
        orderedIds.map((id, index) =>
          tx.playlistTrack.update({
            where: { id: entryKeyToPlaylistTrackId[id] },
            data: {
              position: entryKeyToPosition[id] ?? (index + 1) * GAP,
            },
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
