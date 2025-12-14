import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@utils/authOptions';
import { toNextError, unauthorized } from '@utils/httpError';
import { getTracksAccessibleByUser } from '@services/track';
import prisma from '@utils/prisma';

const MAX_BATCH = 500;

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return toNextError(unauthorized());
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return toNextError(unauthorized());
    }

    const { searchParams } = new URL(request.url);
    const ids = searchParams.getAll('id').slice(0, MAX_BATCH);

    if (!ids.length) {
      return NextResponse.json({ tracks: [] });
    }

    const tracks = await getTracksAccessibleByUser(user.id, ids);

    return NextResponse.json({ tracks });
  } catch (error) {
    return toNextError(error, 'Error fetching tracks');
  }
}
