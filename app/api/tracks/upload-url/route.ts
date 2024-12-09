import { NextRequest, NextResponse } from 'next/server';
import AWS from 'aws-sdk';
import { nanoid } from 'nanoid';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../utils/authOptions';

AWS.config.update({
  region: process.env.S3_REGION!,
  accessKeyId: process.env.S3_ACCESS_KEY!,
  secretAccessKey: process.env.S3_SECRET_KEY!,
});

const s3 = new AWS.S3();

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, type } = await request.json();

  if (!name || !type) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 },
    );
  }

  const fileExtension = name.substring(name.lastIndexOf('.'));
  const fileName = `${nanoid()}${fileExtension}`;

  const s3Params = {
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: fileName,
    Expires: 600,
    ContentType: type,
  };

  try {
    const uploadURL = await s3.getSignedUrlPromise('putObject', s3Params);

    return NextResponse.json({ uploadURL, key: fileName });
  } catch (error) {
    console.error('Error generating pre-signed URL', error);
    return NextResponse.json(
      { error: 'Error generating pre-signed URL' },
      { status: 500 },
    );
  }
}
