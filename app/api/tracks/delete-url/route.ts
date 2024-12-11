import { NextRequest, NextResponse } from 'next/server';
import AWS from 'aws-sdk';
import { getServerSession } from 'next-auth';
import prisma from '@/../utils/prisma';
import { authOptions } from '../../../../utils/authOptions';

AWS.config.update({
  region: process.env.S3_REGION!,
  accessKeyId: process.env.S3_ACCESS_KEY!,
  secretAccessKey: process.env.S3_SECRET_KEY!,
});

const s3 = new AWS.S3();

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

  const s3Params = {
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: audio.s3Key,
    Expires: 60,
  };

  try {
    const deleteURL = await s3.getSignedUrlPromise('deleteObject', s3Params);

    return NextResponse.json({ deleteURL }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Error generating pre-signed URL' },
      { status: 500 },
    );
  }
}
