import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@utils/authOptions';
import { parseJsonBody } from '@utils/validation';
import { trackCreateSchema } from '@utils/apiSchemas';
import { createTrackForUser, listTracksForUser } from '@services/track';
import { toNextError, unauthorized } from '@utils/httpError';
import prisma from '@utils/prisma';

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
    });

    if (!user) {
      return toNextError(unauthorized());
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

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return toNextError(unauthorized());
  }

  try {
    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tracks = await listTracksForUser(user.id);

    return NextResponse.json({ tracks }, { status: 200 });
  } catch (error) {
    return toNextError(error, 'Error fetching tracks');
  }
}
