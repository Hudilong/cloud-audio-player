import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/../utils/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../utils/authOptions';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, artist, album, duration, s3Key } = await request.json();

  if (!title || !artist || !duration || !s3Key) {
    return NextResponse.json(
      { error: 'Missing required fields' },
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing audioId parameter' },
        { status: 400 },
      );
    }

    // Save the audio metadata and file URL to the database
    const track = await prisma.track.update({
      data: {
        title,
        artist,
        album,
        duration, // Duration in seconds
        s3Key,
        userId: user.id,
      },
      where: { id },
    });

    return NextResponse.json(
      {
        message: 'Track updated successfully',
        track,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: 'Error saving track' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing audioId parameter' },
        { status: 400 },
      );
    }

    const track = await prisma.track.findUnique({
      where: {
        id,
      },
    });

    return NextResponse.json({ track }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Error fetching track' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing audioId parameter' },
        { status: 400 },
      );
    }

    const track = await prisma.track.delete({
      where: { id },
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    if (track.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(
      {
        message: 'Track deleted successfully',
        track,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: 'Error deleting track' },
      { status: 500 },
    );
  }
}
