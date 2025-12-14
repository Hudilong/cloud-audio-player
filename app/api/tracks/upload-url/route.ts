import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getServerSession } from 'next-auth';
import { fileTypeFromBuffer } from 'file-type';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { authOptions } from '@utils/authOptions';
import prisma from '@utils/prisma';
import { toNextError } from '@utils/httpError';
import { applyRateLimit, rateLimitHeaders } from '@utils/rateLimiter';
import { assertTrackUploadQuota } from '@services/quota';
import { AUDIO_UPLOAD_LIMIT_BYTES, formatBytes } from '@utils/limits';

const s3 = new S3Client({
  region: process.env.BUCKET_REGION!,
  endpoint: process.env.BUCKET_ENDPOINT!,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.BUCKET_ACCESS_KEY_ID!,
    secretAccessKey: process.env.BUCKET_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email ?? '' },
    select: { id: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateResult = applyRateLimit(
    `upload-user:${user.id}`,
    50,
    15 * 60 * 1000,
  );
  if (!rateResult.allowed) {
    return NextResponse.json(
      {
        error: 'Too many upload attempts. Please try again later.',
        code: 'UPLOAD_RATE_LIMIT',
      },
      { status: 429, headers: rateLimitHeaders(rateResult) },
    );
  }

  const { name, type, fileBuffer } = await request.json();

  if (!fileBuffer || typeof fileBuffer !== 'string') {
    return NextResponse.json(
      { error: 'Invalid file payload' },
      { status: 400 },
    );
  }

  // Validate file content
  const fileTypeInfo = await fileTypeFromBuffer(
    Buffer.from(fileBuffer, 'base64'),
  );
  const allowedMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg'];

  if (!fileTypeInfo || !allowedMimeTypes.includes(fileTypeInfo.mime)) {
    return NextResponse.json(
      { error: 'Invalid file type.', code: 'UPLOAD_TYPE_INVALID' },
      { status: 400 },
    );
  }

  if (!name || !type) {
    return NextResponse.json(
      { error: 'Missing required parameters', code: 'BAD_REQUEST' },
      { status: 400 },
    );
  }

  const fileSizeBytes = Buffer.byteLength(fileBuffer || '', 'base64');
  if (fileSizeBytes > AUDIO_UPLOAD_LIMIT_BYTES) {
    return NextResponse.json(
      {
        error: `File too large. Max allowed is ${formatBytes(
          AUDIO_UPLOAD_LIMIT_BYTES,
        )}.`,
        code: 'UPLOAD_SIZE_EXCEEDED',
      },
      { status: 413 },
    );
  }

  try {
    if (user.role !== 'ADMIN') {
      await assertTrackUploadQuota(user.id);
    }
  } catch (error) {
    return toNextError(error, 'Upload limit reached');
  }

  const fileExtension = name.substring(name.lastIndexOf('.'));
  const fileName = `${nanoid()}${fileExtension}`;

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME!,
      Key: fileName,
      ContentType: type,
    });

    const uploadURL = await getSignedUrl(s3, command, { expiresIn: 600 });

    return NextResponse.json({ uploadURL, key: fileName });
  } catch {
    return NextResponse.json(
      { error: 'Error generating pre-signed URL' },
      { status: 500 },
    );
  }
}
