import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@utils/authOptions';
import { parseJsonBody } from '@utils/validation';
import { playbackUpdateSchema } from '@utils/apiSchemas';
import { toNextError, unauthorized } from '@utils/httpError';
import {
  getPlaybackStateForUser,
  updatePlaybackStateForUser,
} from '@services/playback';
import prisma from '@utils/prisma';

async function getUserFromSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    throw unauthorized();
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw unauthorized();
  }

  return user.id;
}

export async function GET() {
  try {
    const userId = await getUserFromSession();
    const playbackState = await getPlaybackStateForUser(userId);

    if (!playbackState) {
      return NextResponse.json(
        { message: 'No playback state found' },
        { status: 200 },
      );
    }
    return NextResponse.json(playbackState, { status: 200 });
  } catch (error) {
    return toNextError(error);
  }
}

export async function POST(request: NextRequest) {
  const parsed = await parseJsonBody(request, playbackUpdateSchema);
  if (!parsed.success) return parsed.error;

  try {
    const userId = await getUserFromSession();
    await updatePlaybackStateForUser(userId, parsed.data);

    return NextResponse.json(
      { message: 'Playback state updated' },
      { status: 200 },
    );
  } catch (error) {
    return toNextError(error);
  }
}
