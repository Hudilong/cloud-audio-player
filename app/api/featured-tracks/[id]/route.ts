import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@utils/prisma';
import { authOptions } from '@utils/authOptions';
import {
  forbidden,
  notFound,
  toNextError,
  unauthorized,
} from '@utils/httpError';
import { parseJsonBody } from '@utils/validation';
import { trackUpdateSchema } from '@utils/apiSchemas';
import { removeTrackFromFeatured } from '@services/featured';

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }
  return prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const parsed = await parseJsonBody(request, trackUpdateSchema);
  if (!parsed.success) return parsed.error;

  try {
    const user = await getUser();
    if (!user) {
      return toNextError(unauthorized());
    }
    const existing = await prisma.track.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return toNextError(notFound('Track not found'));
    }
    if (existing.userId !== user.id && user.role !== 'ADMIN') {
      return toNextError(forbidden('Admin access required'));
    }

    const track = await prisma.track.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json({ message: 'Track updated', track });
  } catch (error) {
    return toNextError(error, 'Error updating featured track');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getUser();
    if (!user) {
      return toNextError(unauthorized());
    }

    const track = await prisma.track.findUnique({
      where: { id: params.id },
    });

    if (!track) {
      return toNextError(notFound('Track not found'));
    }

    if (track.userId !== user.id && user.role !== 'ADMIN') {
      return toNextError(forbidden('Access denied'));
    }

    await removeTrackFromFeatured(params.id);
    return NextResponse.json({ message: 'Removed from featured' });
  } catch (error) {
    return toNextError(error, 'Error removing track from featured');
  }
}
