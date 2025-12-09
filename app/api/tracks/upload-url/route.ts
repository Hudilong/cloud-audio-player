import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getServerSession } from 'next-auth';
import { fileTypeFromBuffer } from 'file-type';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, type, fileBuffer } = await request.json();

  // Validate file content
  const fileTypeInfo = await fileTypeFromBuffer(
    Buffer.from(fileBuffer, 'base64'),
  );
  const allowedMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg'];

  if (!fileTypeInfo || !allowedMimeTypes.includes(fileTypeInfo.mime)) {
    return NextResponse.json({ error: 'Invalid file type.' }, { status: 400 });
  }

  if (!name || !type) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 },
    );
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
