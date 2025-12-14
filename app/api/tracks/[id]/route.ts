import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { parseJsonBody } from '@utils/validation';
import { authOptions } from '@utils/authOptions';
import { trackUpdateSchema } from '@utils/apiSchemas';
import {
  deleteTrackForUser,
  getTrackForUser,
  updateTrackForUser,
} from '@services/track';
import prisma from '@utils/prisma';
import { toNextError, unauthorized } from '@utils/httpError';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return toNextError(unauthorized());
  }

  const parsed = await parseJsonBody(request, trackUpdateSchema);
  if (!parsed.success) return parsed.error;

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return toNextError(unauthorized());
    }

    const { id } = params;

    const updatedTrack =
      user.role === 'ADMIN'
        ? await prisma.track.update({
            where: { id },
            data: parsed.data,
          })
        : await updateTrackForUser(user.id, id, parsed.data);

    return NextResponse.json(
      {
        message: 'Track updated successfully',
        track: updatedTrack,
      },
      { status: 200 },
    );
  } catch (error) {
    return toNextError(error, 'Error saving track');
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return toNextError(unauthorized());
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return toNextError(unauthorized());
    }

    const { id } = params;

    const track =
      user.role === 'ADMIN'
        ? await prisma.track.findUnique({ where: { id } })
        : await getTrackForUser(user.id, id);

    return NextResponse.json({ track }, { status: 200 });
  } catch (error) {
    return toNextError(error, 'Error fetching track');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return toNextError(unauthorized());
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return toNextError(unauthorized());
    }

    const { id } = params;

    const track = await deleteTrackForUser(user.id, id);

    return NextResponse.json(
      {
        message: 'Track deleted successfully',
        track,
      },
      { status: 200 },
    );
  } catch (error) {
    return toNextError(error, 'Error deleting track');
  }
}
