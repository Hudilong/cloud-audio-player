import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@utils/authOptions';
import { parseJsonBody } from '@utils/validation';
import { trackCreateSchema } from '@utils/apiSchemas';
import { createTrackForUser, listTracksForUser } from '@services/track';
import { toNextError, unauthorized } from '@utils/httpError';
import prisma from '@utils/prisma';
import { assertTrackUploadQuota } from '@services/quota';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return toNextError(unauthorized());
  }

  const parsed = await parseJsonBody(request, trackCreateSchema);
  if (!parsed.success) return parsed.error;

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return toNextError(unauthorized());
    }

    if (user.role !== 'ADMIN') {
      await assertTrackUploadQuota(user.id);
    }

    const track = await createTrackForUser(user.id, parsed.data);

    return NextResponse.json(
      {
        message: 'Track saved successfully',
        track,
      },
      { status: 201 },
    );
  } catch (error) {
    return toNextError(error, 'Error saving track');
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return toNextError(unauthorized());
  }

  try {
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor');
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? Number(limitParam) : undefined;

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { tracks, nextCursor } = await listTracksForUser(user.id, {
      cursor,
      limit,
    });

    return NextResponse.json({ tracks, nextCursor }, { status: 200 });
  } catch (error) {
    return toNextError(error, 'Error fetching tracks');
  }
}
