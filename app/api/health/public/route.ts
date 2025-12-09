import { NextResponse } from 'next/server';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import prisma from '@utils/prisma';

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
  const dbStatus: 'ok' | 'error' = 'ok';
  const storageStatus: 'ok' | 'error' | 'not_configured' = 'ok';

  let db: typeof dbStatus = 'ok';
  let storage: typeof storageStatus = 'ok';

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = 'error';
  }

  const bucketName = process.env.BUCKET_NAME;
  const accessKeyId = process.env.BUCKET_ACCESS_KEY_ID;
  const secretAccessKey = process.env.BUCKET_SECRET_ACCESS_KEY;
  const region = process.env.BUCKET_REGION;
  const endpoint = process.env.BUCKET_ENDPOINT;

  if (!bucketName || !accessKeyId || !secretAccessKey || !region) {
    storage = 'not_configured';
  } else {
    try {
      const s3 = createS3Client(
        region,
        endpoint,
        accessKeyId,
        secretAccessKey,
      );
      await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
    } catch {
      storage = 'error';
    }
  }

  const statusCode = db === 'ok' && storage === 'ok' ? 200 : 500;

  return NextResponse.json(
    {
      db,
      storage,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode },
  );
}
