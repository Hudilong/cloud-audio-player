import { describe, expect, it, beforeEach, vi } from 'vitest';
import { GET, POST } from '@/api/playback/route';

const {
  getServerSessionMock,
  playbackFindUnique,
  playbackUpsert,
  trackFindFirst,
  userFindUnique,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  playbackFindUnique: vi.fn(),
  playbackUpsert: vi.fn(),
  trackFindFirst: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock('next-auth', () => ({
  __esModule: true,
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

vi.mock('@utils/prisma', () => ({
  __esModule: true,
  default: {
    user: { findUnique: userFindUnique },
    playbackState: {
      findUnique: playbackFindUnique,
      upsert: playbackUpsert,
    },
    track: {
      findFirst: trackFindFirst,
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

const buildRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost/api/playback', {
    method: 'POST',
    body: JSON.stringify(body),
  });

describe('api/playback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue({
      user: { email: 'test@example.com', id: 'user-1' },
    });
    userFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
    });
    trackFindFirst.mockResolvedValue({ id: 'track-1', userId: 'user-1' });
    playbackFindUnique.mockResolvedValue({
      trackId: 'track-1',
      track: { id: 'track-1' },
      position: 0,
      isPlaying: false,
      volume: 1,
      shuffle: false,
      repeat: false,
      repeatMode: 'off',
      currentTrackIndex: 0,
      tracks: { queueTrackIds: [], repeatMode: 'off' },
      updatedAt: new Date(),
    });
    playbackUpsert.mockResolvedValue({});
  });

  it('rejects invalid payload', async () => {
    const res = await POST(
      buildRequest({
        trackId: '',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('upserts playback state on POST', async () => {
    trackFindFirst.mockResolvedValue({ id: 'track-1', userId: 'user-1' });
    playbackUpsert.mockResolvedValue({});

    const res = await POST(
      buildRequest({
        trackId: 'track-1',
        position: 12,
        isPlaying: true,
        volume: 0.8,
        isShuffle: false,
        repeatMode: 'queue',
        currentTrackIndex: 0,
        queueTrackIds: ['track-1'],
      }),
    );

    expect(res.status).toBe(200);
    expect(playbackUpsert).toHaveBeenCalled();
  });

  it('returns playback state on GET', async () => {
    playbackFindUnique.mockResolvedValue({
      trackId: 'track-1',
      track: { id: 'track-1' },
      position: 10,
      isPlaying: false,
      volume: 1,
      shuffle: false,
      repeat: false,
      repeatMode: 'off',
      currentTrackIndex: 0,
      tracks: { queueTrackIds: ['track-1'], repeatMode: 'off' },
      updatedAt: new Date(),
    });
    vi.mocked(trackFindFirst);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.trackId).toBe('track-1');
  });
});
