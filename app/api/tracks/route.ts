import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/../utils/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../utils/authOptions';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, artist, album, duration, s3Key, genre } = await request.json();

  if (!title || !artist || !duration || !s3Key || !genre) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    );
  }

  try {
    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Save the audio metadata and file URL to the database
    const track = await prisma.track.create({
      data: {
        title,
        artist,
        album,
        genre,
        duration, // Duration in seconds
        s3Key,
        userId: user.id,
      },
    });

    return NextResponse.json(
      {
        message: 'Track saved successfully',
        track,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: 'Error saving track' }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all tracks for the authenticated user
    const tracks = await prisma.track.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ tracks }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Error fetching tracks' },
      { status: 500 },
    );
  }
}
