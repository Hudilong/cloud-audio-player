import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@utils/authOptions';
import prisma from '@utils/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const playlists = await prisma.playlist.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        playlistTracks: {
          orderBy: { position: 'asc' },
          include: { track: true },
        },
      },
    });

    return NextResponse.json({ playlists });
  } catch {
    return NextResponse.json(
      { error: 'Error fetching playlists' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await request.json();

  if (!name || typeof name !== 'string') {
    return NextResponse.json(
      { error: 'Playlist name is required' },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const playlist = await prisma.playlist.create({
      data: {
        name: name.trim(),
        userId: user.id,
      },
    });

    return NextResponse.json({ playlist }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Error creating playlist' },
      { status: 500 },
    );
  }
}
