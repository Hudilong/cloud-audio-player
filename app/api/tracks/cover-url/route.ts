import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
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
  const trackId = url.searchParams.get('trackId');
  const keyParam = url.searchParams.get('key');

  if (!trackId && !keyParam) {
    return NextResponse.json(
      { error: 'trackId or key is required' },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  let imageKey = keyParam || '';

  if (trackId) {
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      select: { imageURL: true, userId: true, isFeatured: true },
    });

    if (!track || !track.imageURL) {
      return NextResponse.json({ error: 'Cover not found' }, { status: 404 });
    }

    const ownsTrack = track.userId === user.id;
    if (!ownsTrack && !track.isFeatured && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    imageKey = track.imageURL;
  } else if (keyParam) {
    const trackForKey = await prisma.track.findFirst({
      where: { imageURL: keyParam },
      select: { id: true, userId: true, isFeatured: true },
    });
    if (!trackForKey) {
      return NextResponse.json({ error: 'Cover not found' }, { status: 404 });
    }
    const ownsTrack = trackForKey.userId === user.id;
    if (!ownsTrack && !trackForKey.isFeatured && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  if (!imageKey) {
    return NextResponse.json({ error: 'Cover not found' }, { status: 404 });
  }

  // If the cover is already a URL, proxy it so Next/Image can consume bytes from this origin.
  if (imageKey.startsWith('http')) {
    try {
      const proxyRes = await fetch(imageKey);
      if (!proxyRes.ok || !proxyRes.body) {
        return NextResponse.json(
          { error: 'Cover not accessible' },
          { status: 404 },
        );
      }
      const contentType = proxyRes.headers.get('content-type') || 'image/jpeg';
      return new NextResponse(proxyRes.body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=300',
        },
      });
    } catch (error) {
      // eslint-disable-next-line no-console -- proxy failures should surface for debugging
      console.error('Error proxying cover URL', error);
      return NextResponse.json(
        { error: 'Error retrieving cover' },
        { status: 500 },
      );
    }
  }

  const bucketName = process.env.BUCKET_NAME;
  const accessKeyId = process.env.BUCKET_ACCESS_KEY_ID;
  const secretAccessKey = process.env.BUCKET_SECRET_ACCESS_KEY;
  const region = process.env.BUCKET_REGION;
  const endpoint = process.env.BUCKET_ENDPOINT;

  if (!bucketName || !accessKeyId || !secretAccessKey || !region) {
    const publicUrl = getPublicUrl(imageKey);
    if (publicUrl) {
      try {
        const proxyRes = await fetch(publicUrl);
        if (!proxyRes.ok || !proxyRes.body) {
          return NextResponse.json(
            { error: 'Cover not accessible' },
            { status: 404 },
          );
        }
        const contentType =
          proxyRes.headers.get('content-type') || 'image/jpeg';
        return new NextResponse(proxyRes.body, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=300',
          },
        });
      } catch (error) {
        // eslint-disable-next-line no-console -- proxy failures should surface for debugging
        console.error('Error proxying cover URL', error);
      }
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
      Key: imageKey,
    });

    const s3Response = await s3.send(command);
    const body = s3Response.Body;

    if (!body) {
      return NextResponse.json({ error: 'Cover not found' }, { status: 404 });
    }

    return new NextResponse(body as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': s3Response.ContentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console -- surface proxy failures for debugging
    console.error('Error streaming cover', error);
    const publicUrl = getPublicUrl(imageKey);
    if (publicUrl) {
      try {
        const proxyRes = await fetch(publicUrl);
        if (!proxyRes.ok || !proxyRes.body) {
          return NextResponse.json(
            { error: 'Cover not accessible' },
            { status: 404 },
          );
        }
        const contentType =
          proxyRes.headers.get('content-type') || 'image/jpeg';
        return new NextResponse(proxyRes.body, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=300',
          },
        });
      } catch (proxyError) {
        // eslint-disable-next-line no-console -- proxy failures should surface for debugging
        console.error('Error proxying cover URL', proxyError);
      }
    }
    return NextResponse.json(
      { error: 'Error retrieving cover' },
      { status: 500 },
    );
  }
}
