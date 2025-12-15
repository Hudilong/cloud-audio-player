import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@utils/prisma';
import { authOptions } from '@utils/authOptions';
import { forbidden, toNextError, unauthorized } from '@utils/httpError';
import { parseJsonBody } from '@utils/validation';
import { reorderFeaturedTracks } from '@services/featured';
import { z } from 'zod';

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

export async function PATCH(request: NextRequest) {
  const parsed = await parseJsonBody(
    request,
    z.object({ ids: z.array(z.string().min(1)).min(1) }),
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

    const tracks = await reorderFeaturedTracks(parsed.data.ids);
    return NextResponse.json({ message: 'Order updated', tracks });
  } catch (error) {
    return toNextError(error, 'Error reordering featured tracks');
  }
}
