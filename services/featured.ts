import { Prisma, Role } from '@prisma/client';
import prisma from '@utils/prisma';
import { badRequest, notFound } from '@utils/httpError';

const ORDER_GAP = 100;
const FEATURED_PLAYLIST_NAME =
  process.env.FEATURED_PLAYLIST_NAME || 'Featured';
const FEATURED_SYSTEM_EMAIL =
  process.env.FEATURED_SYSTEM_EMAIL || 'featured@system.local';
const FEATURED_SYSTEM_NAME =
  process.env.FEATURED_SYSTEM_NAME || 'Featured Playlist';

async function ensureSystemUser(tx: Prisma.TransactionClient = prisma) {
  let systemUser = await tx.user.findUnique({
    where: { email: FEATURED_SYSTEM_EMAIL },
  });

  if (!systemUser) {
    systemUser = await tx.user.create({
      data: {
        email: FEATURED_SYSTEM_EMAIL,
        name: FEATURED_SYSTEM_NAME,
        role: Role.ADMIN,
      },
    });
  }

  return systemUser;
}

export async function ensureFeaturedPlaylist(
  tx: Prisma.TransactionClient = prisma,
) {
  const systemUser = await ensureSystemUser(tx);

  let playlist = await tx.playlist.findFirst({
    where: { userId: systemUser.id, name: FEATURED_PLAYLIST_NAME },
  });

  if (!playlist) {
    playlist = await tx.playlist.create({
      data: {
        name: FEATURED_PLAYLIST_NAME,
        userId: systemUser.id,
      },
    });
  }

  return playlist;
}

export async function listFeaturedTracks() {
  const playlist = await ensureFeaturedPlaylist();

  const tracks = await prisma.playlistTrack.findMany({
    where: { playlistId: playlist.id },
    orderBy: { position: 'asc' },
    include: { track: true },
  });

  return tracks
    .filter((item) => item.track)
    .map((item) => ({
      ...item.track,
      isFeatured: true,
      order: item.position,
    }));
}

export async function isTrackFeatured(trackId: string) {
  const playlist = await ensureFeaturedPlaylist();
  const membership = await prisma.playlistTrack.findFirst({
    where: { playlistId: playlist.id, trackId },
  });
  return Boolean(membership);
}

export async function addTrackToFeatured(trackId: string, position?: number) {
  const playlist = await ensureFeaturedPlaylist();
  const track = await prisma.track.findUnique({ where: { id: trackId } });

  if (!track) {
    throw notFound('Track not found');
  }

  const existing = await prisma.playlistTrack.findFirst({
    where: { playlistId: playlist.id, trackId },
  });

  if (existing) {
    return { ...track, isFeatured: true, order: existing.position };
  }

  const { _max } = await prisma.playlistTrack.aggregate({
    where: { playlistId: playlist.id },
    _max: { position: true },
  });

  const nextPosition =
    typeof position === 'number'
      ? position
      : (Number(_max?.position) || 0) + ORDER_GAP;

  const [created] = await prisma.$transaction([
    prisma.playlistTrack.create({
      data: {
        playlistId: playlist.id,
        trackId,
        position: nextPosition,
      },
    }),
    prisma.track.update({
      where: { id: trackId },
      data: { isFeatured: true },
    }),
  ]);

  return {
    ...track,
    isFeatured: true,
    order: created.position,
  };
}

export async function removeTrackFromFeatured(trackId: string) {
  const playlist = await ensureFeaturedPlaylist();

  await prisma.$transaction(async (tx) => {
    await tx.playlistTrack.deleteMany({
      where: { playlistId: playlist.id, trackId },
    });

    const remaining = await tx.playlistTrack.findMany({
      where: { playlistId: playlist.id },
      orderBy: { position: 'asc' },
    });

    await Promise.all(
      remaining.map((item, index) =>
        tx.playlistTrack.update({
          where: { id: item.id },
          data: { position: (index + 1) * ORDER_GAP },
        }),
      ),
    );

    await tx.track.updateMany({
      where: { id: trackId },
      data: { isFeatured: false },
    });
  });
}

export async function reorderFeaturedTracks(ids: string[]) {
  const playlist = await ensureFeaturedPlaylist();
  const tracks = await prisma.playlistTrack.findMany({
    where: { playlistId: playlist.id },
  });

  const currentIds = new Set(tracks.map((item) => item.trackId));
  const providedIds = new Set(ids);

  if (currentIds.size !== providedIds.size) {
    throw badRequest('All featured tracks must be included for reorder');
  }

  for (const id of currentIds) {
    if (!providedIds.has(id)) {
      throw badRequest('All featured tracks must be included for reorder');
    }
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.playlistTrack.updateMany({
        where: { playlistId: playlist.id, trackId: id },
        data: { position: (index + 1) * ORDER_GAP },
      }),
    ),
  );

  return listFeaturedTracks();
}
