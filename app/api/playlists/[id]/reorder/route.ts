import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@utils/authOptions';
import { parseJsonBody } from '@utils/validation';
import { playlistReorderSchema } from '@utils/apiSchemas';
import { toNextError, unauthorized } from '@utils/httpError';
import { reorderPlaylistForUser } from '@services/playlist';
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const parsed = await parseJsonBody(request, playlistReorderSchema);
  if (!parsed.success) return parsed.error;
  const { items } = parsed.data;

  try {
    const userId = await getUserFromSession();
    const updated = await reorderPlaylistForUser(userId, params.id, items);

    return NextResponse.json(
      { message: 'Playlist reordered', playlist: updated },
      { status: 200 },
    );
  } catch (error) {
    return toNextError(error);
  }
}
