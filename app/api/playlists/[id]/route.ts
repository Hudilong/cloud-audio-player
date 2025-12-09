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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getUserFromSession();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const playlist = await prisma.playlist.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        playlistTracks: {
          orderBy: { position: 'asc' },
          include: { track: true },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ playlist });
  } catch {
    return NextResponse.json(
      { error: 'Error fetching playlist' },
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

  try {
    const playlist = await prisma.playlist.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 },
      );
    }

    await prisma.playlistTrack.deleteMany({
      where: { playlistId: params.id },
    });

    await prisma.playlist.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Playlist deleted' });
  } catch {
    return NextResponse.json(
      { error: 'Error deleting playlist' },
      { status: 500 },
    );
  }
}
