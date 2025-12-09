import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import prisma from '@utils/prisma';
import { authOptions } from '@utils/authOptions';

const s3 = new S3Client({
  region: process.env.BUCKET_REGION!,
  endpoint: process.env.BUCKET_ENDPOINT!,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.BUCKET_ACCESS_KEY_ID!,
    secretAccessKey: process.env.BUCKET_SECRET_ACCESS_KEY!,
  },
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Invalid audio ID' }, { status: 400 });
  }

  const audio = await prisma.track.findUnique({
    where: { id },
  });

  if (!audio) {
    return NextResponse.json({ error: 'Audio not found' }, { status: 404 });
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.BUCKET_NAME!,
      Key: audio.s3Key,
    });

    const deleteURL = await getSignedUrl(s3, command, { expiresIn: 60 });

    return NextResponse.json({ deleteURL }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Error generating pre-signed URL' },
      { status: 500 },
    );
  }
}
