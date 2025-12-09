import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import prisma from '@utils/prisma';
import { authOptions } from '@utils/authOptions';

const getPublicUrl = (key: string) => {
  const base = process.env.NEXT_PUBLIC_BUCKET_URL;
  if (!base) return null;
  const normalized = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${normalized}/${key}`;
};

const createS3Client = (
  region: string,
  endpoint: string | undefined,
  accessKeyId: string,
  secretAccessKey: string,
) =>
  new S3Client({
    region,
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Invalid audio ID' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const audio = await prisma.track.findFirst({
    where: { id, userId: user.id },
  });

  if (!audio) {
    return NextResponse.json(
      { error: 'Audio not found or access denied' },
      { status: 403 },
    );
  }

  if (!audio.s3Key) {
    return NextResponse.json(
      { error: 'Track is missing a storage key' },
      { status: 500 },
    );
  }

  const bucketName = process.env.BUCKET_NAME;
  const accessKeyId = process.env.BUCKET_ACCESS_KEY_ID;
  const secretAccessKey = process.env.BUCKET_SECRET_ACCESS_KEY;
  const region = process.env.BUCKET_REGION;
  const endpoint = process.env.BUCKET_ENDPOINT;

  if (!bucketName || !accessKeyId || !secretAccessKey || !region) {
    const publicUrl = getPublicUrl(audio.s3Key);
    if (publicUrl) {
      return NextResponse.json({ streamURL: publicUrl }, { status: 200 });
    }
    return NextResponse.json(
      { error: 'Storage is not configured' },
      { status: 500 },
    );
  }

  try {
    const s3 = createS3Client(region, endpoint, accessKeyId, secretAccessKey);

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: audio.s3Key,
    });

    const streamURL = await getSignedUrl(s3, command, { expiresIn: 600 });

    return NextResponse.json({ streamURL }, { status: 200 });
  } catch (error) {
    console.error('Error generating pre-signed URL', error);
    const publicUrl = getPublicUrl(audio.s3Key);
    if (publicUrl) {
      return NextResponse.json({ streamURL: publicUrl }, { status: 200 });
    }
    return NextResponse.json(
      { error: 'Error generating pre-signed URL' },
      { status: 500 },
    );
  }
}
