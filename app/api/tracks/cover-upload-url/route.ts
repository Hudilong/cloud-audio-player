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

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

type VariantName = 'original' | 'large' | 'thumb';

interface VariantConfig {
  name: VariantName;
  key: string;
  contentType: string;
}

const buildVariantConfigs = (
  baseKey: string,
  extension: string,
): VariantConfig[] => [
  {
    name: 'original',
    key: `${baseKey}/original.${extension}`,
    contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
  },
  {
    name: 'large',
    key: `${baseKey}/large.webp`,
    contentType: 'image/webp',
  },
  {
    name: 'thumb',
    key: `${baseKey}/thumb.webp`,
    contentType: 'image/webp',
  },
];

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { fileBuffer, type } = await request.json();

  if (!fileBuffer || !type) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 },
    );
  }

  const fileTypeInfo = await fileTypeFromBuffer(
    Buffer.from(fileBuffer, 'base64'),
  );

  if (!fileTypeInfo || !allowedMimeTypes.includes(fileTypeInfo.mime)) {
    return NextResponse.json({ error: 'Invalid image type.' }, { status: 400 });
  }

  const extension = fileTypeInfo.ext === 'jpeg' ? 'jpg' : fileTypeInfo.ext;
  const baseKey = `covers/${nanoid()}`;
  const variants = buildVariantConfigs(baseKey, extension);

  try {
    const urls = await Promise.all(
      variants.map(async (variant) => {
        const command = new PutObjectCommand({
          Bucket: process.env.BUCKET_NAME!,
          Key: variant.key,
          ContentType: variant.contentType,
        });

        const uploadURL = await getSignedUrl(s3, command, { expiresIn: 600 });

        return {
          name: variant.name,
          key: variant.key,
          uploadURL,
          contentType: variant.contentType,
        };
      }),
    );

    const response = urls.reduce(
      (acc, variant) => ({
        ...acc,
        [variant.name]: {
          key: variant.key,
          uploadURL: variant.uploadURL,
          contentType: variant.contentType,
        },
      }),
      {} as Record<
        VariantName,
        { key: string; uploadURL: string; contentType: string }
      >,
    );

    return NextResponse.json({ variants: response, baseKey });
  } catch {
    return NextResponse.json(
      { error: 'Error generating pre-signed URLs' },
      { status: 500 },
    );
  }
}
