import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@utils/authOptions';
import { parseJsonBody } from '@utils/validation';
import { featuredAddSchema, FeaturedAddBody } from '@utils/apiSchemas';
import { addTrackToFeatured, listFeaturedTracks } from '@services/featured';
import prisma from '@utils/prisma';
import { forbidden, toNextError, unauthorized } from '@utils/httpError';

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

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return toNextError(unauthorized());
    }

    const tracks = await listFeaturedTracks();
    return NextResponse.json({ tracks, featured: true });
  } catch (error) {
    return toNextError(error, 'Error fetching featured tracks');
  }
}

export async function POST(request: NextRequest) {
  const parsed = await parseJsonBody<FeaturedAddBody>(
    request,
    featuredAddSchema,
  );
  if (!parsed.success) return parsed.error;

  try {
    const user = await getUser();
    if (!user) {
      return toNextError(unauthorized());
    }
    if (user.role !== 'ADMIN') {
      return toNextError(forbidden('Admin access required'));
    }

    const track = await addTrackToFeatured(parsed.data.trackId);
    return NextResponse.json(
      { message: 'Track added to featured', track },
      { status: 201 },
    );
  } catch (error) {
    return toNextError(error, 'Error adding track to featured');
  }
}
