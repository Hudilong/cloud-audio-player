import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@utils/prisma';
import { authOptions } from '@utils/authOptions';

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

async function getPlaylistForUser(playlistId: string, userId: string) {
  return prisma.playlist.findFirst({
    where: { id: playlistId, userId },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getUserFromSession();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { trackId } = await request.json();

  if (!trackId || typeof trackId !== 'string') {
    return NextResponse.json({ error: 'trackId is required' }, { status: 400 });
  }

  try {
    const playlist = await getPlaylistForUser(params.id, user.id);

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 },
      );
    }

    const track = await prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!track || (track.userId !== user.id && !track.isFeatured)) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    const existingTrack = await prisma.playlistTrack.findFirst({
      where: {
        playlistId: params.id,
        trackId,
      },
    });

    if (existingTrack) {
      return NextResponse.json(
        { error: 'Track already in playlist' },
        { status: 409 },
      );
    }

    const { _max: maxPosition } = await prisma.playlistTrack.aggregate({
      where: { playlistId: params.id },
      _max: { position: true },
    });

    await prisma.playlistTrack.create({
      data: {
        playlistId: params.id,
        trackId,
        position: (Number(maxPosition?.position) || 0) + 100,
      },
    });

    await prisma.playlist.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    });

    const updatedPlaylist = await prisma.playlist.findUnique({
      where: { id: params.id },
      include: {
        playlistTracks: {
          orderBy: { position: 'asc' },
          include: { track: true },
        },
      },
    });

    return NextResponse.json(
      { message: 'Track added to playlist', playlist: updatedPlaylist },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: 'Error adding track to playlist' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getUserFromSession();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { trackId } = await request.json();

  if (!trackId || typeof trackId !== 'string') {
    return NextResponse.json({ error: 'trackId is required' }, { status: 400 });
  }

  try {
    const playlist = await getPlaylistForUser(params.id, user.id);

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 },
      );
    }

    await prisma.playlistTrack.deleteMany({
      where: {
        playlistId: params.id,
        trackId,
      },
    });

    const remainingTracks = await prisma.playlistTrack.findMany({
      where: { playlistId: params.id },
      orderBy: { position: 'asc' },
    });

    await Promise.all(
      remainingTracks.map((playlistTrack, index) =>
        prisma.playlistTrack.update({
          where: { id: playlistTrack.id },
          data: { position: (index + 1) * 100 },
        }),
      ),
    );

    await prisma.playlist.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    });

    const updatedPlaylist = await prisma.playlist.findUnique({
      where: { id: params.id },
      include: {
        playlistTracks: {
          orderBy: { position: 'asc' },
          include: { track: true },
        },
      },
    });

    return NextResponse.json({
      message: 'Track removed from playlist',
      playlist: updatedPlaylist,
    });
  } catch {
    return NextResponse.json(
      { error: 'Error removing track from playlist' },
      { status: 500 },
    );
  }
}
