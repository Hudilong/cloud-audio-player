import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../utils/authOptions';
import prisma from '../../../utils/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session?.user?.id;

  try {
    // Retrieve the user's playback state
    const playbackState = await prisma.playbackState.findUnique({
      where: { userId },
      include: {
        track: true,
      },
    });

    if (!playbackState) {
      return NextResponse.json(
        { message: 'No playback state found' },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        trackId: playbackState.trackId,
        position: playbackState.position,
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
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json();
  const { trackId, position } = body;

  if (!trackId || typeof position !== 'number') {
    return NextResponse.json(
      { error: 'trackId and position are required' },
      { status: 400 },
    );
  }

  try {
    // Verify the audio exists and is owned by the user
    const audio = await prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!audio || audio.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied to this audio' },
        { status: 403 },
      );
    }

    // Update or create the playback state
    await prisma.playbackState.upsert({
      where: { userId },
      update: { trackId, position },
      create: { userId, trackId, position },
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
