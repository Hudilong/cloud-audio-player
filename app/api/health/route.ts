import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import prisma from '@utils/prisma';
import { authOptions } from '@utils/authOptions';

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

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbStatus: { status: 'ok' | 'error'; message?: string } = {
    status: 'ok',
  };
  const storageStatus: {
    status: 'ok' | 'error' | 'not_configured';
    message?: string;
  } = { status: 'ok' };

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbStatus.status = 'error';
    dbStatus.message =
      error instanceof Error ? error.message : 'Database connection failed';
  }

  const bucketName = process.env.BUCKET_NAME;
  const accessKeyId = process.env.BUCKET_ACCESS_KEY_ID;
  const secretAccessKey = process.env.BUCKET_SECRET_ACCESS_KEY;
  const region = process.env.BUCKET_REGION;
  const endpoint = process.env.BUCKET_ENDPOINT;

  if (!bucketName || !accessKeyId || !secretAccessKey || !region) {
    storageStatus.status = 'not_configured';
    storageStatus.message =
      'Missing BUCKET_NAME, BUCKET_REGION or bucket credentials';
  } else {
    try {
      const s3 = createS3Client(
        region,
        endpoint,
        accessKeyId,
        secretAccessKey,
      );
      await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
    } catch (error) {
      storageStatus.status = 'error';
      storageStatus.message =
        error instanceof Error
          ? error.message
          : 'Object storage connection failed';
    }
  }

  return NextResponse.json(
    {
      db: dbStatus,
      storage: storageStatus,
      timestamp: new Date().toISOString(),
    },
    {
      status:
        dbStatus.status === 'ok' && storageStatus.status === 'ok' ? 200 : 500,
    },
  );
}
