import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@utils/authOptions';
import { toNextError, unauthorized } from '@utils/httpError';
import { getTrackOrderForUser } from '@services/track';
import prisma from '@utils/prisma';

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

    const shuffle = new URL(request.url).searchParams.get('shuffle') === 'true';

    const ids = await getTrackOrderForUser(user.id);

    if (shuffle && ids.length > 1) {
      for (let i = ids.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
    }

    return NextResponse.json({
      ids,
      order: shuffle ? 'shuffled' : 'linear',
    });
  } catch (error) {
    return toNextError(error, 'Error fetching track order');
  }
}
