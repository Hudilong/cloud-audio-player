import { describe, expect, it, beforeEach, vi } from 'vitest';
import { GET } from '@/api/tracks/cover-url/route';

const { getServerSessionMock, userFindUnique, trackFindFirst, s3Send } =
  vi.hoisted(() => ({
    getServerSessionMock: vi.fn(),
    userFindUnique: vi.fn(),
    trackFindFirst: vi.fn(),
    s3Send: vi.fn(),
  }));

vi.mock('next-auth', () => ({
  __esModule: true,
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

vi.mock('@utils/prisma', () => ({
  __esModule: true,
  default: {
    user: { findUnique: userFindUnique },
    track: { findFirst: trackFindFirst, findUnique: trackFindFirst },
  },
}));

vi.mock('@aws-sdk/client-s3', () => {
  class S3Client {
    send = (...args: unknown[]) => s3Send(...args);
  }
  class GetObjectCommand {
    constructor(public input: unknown) {}
  }
  return { S3Client, GetObjectCommand };
});

describe('api/tracks/cover-url', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BUCKET_NAME = 'bucket';
    process.env.BUCKET_REGION = 'auto';
    process.env.BUCKET_ACCESS_KEY_ID = 'key';
    process.env.BUCKET_SECRET_ACCESS_KEY = 'secret';
    getServerSessionMock.mockResolvedValue({
      user: { email: 'test@example.com' },
    });
    userFindUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
    trackFindFirst.mockResolvedValue({
      id: 'track-1',
      userId: 'user-1',
      imageURL: 'covers/sample.jpg',
    });
    s3Send.mockResolvedValue({
      Body: new Blob(['data']),
      ContentType: 'image/jpeg',
    });
  });

  it('returns signed cover stream', async () => {
    const res = await GET(
      new Request(
        'http://localhost/api/tracks/cover-url?trackId=track-1',
      ) as any,
    );
    expect(res.status).toBe(200);
  });

  it('rejects unauthorized', async () => {
    getServerSessionMock.mockResolvedValue(null);
    const res = await GET(
      new Request('http://localhost/api/tracks/cover-url?trackId=track-1') as any,
    );
    expect(res.status).toBe(401);
  });
});
