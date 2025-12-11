import { describe, expect, it, beforeEach, vi } from 'vitest';
import { PATCH } from '@/api/playlists/[id]/reorder/route';

const {
  getServerSessionMock,
  userFindUnique,
  playlistFindFirst,
  playlistTrackUpdate,
  playlistUpdate,
  playlistFindUnique,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  userFindUnique: vi.fn(),
  playlistFindFirst: vi.fn(),
  playlistTrackUpdate: vi.fn(),
  playlistUpdate: vi.fn(),
  playlistFindUnique: vi.fn(),
}));

vi.mock('next-auth', () => ({
  __esModule: true,
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

vi.mock('@utils/prisma', () => ({
  __esModule: true,
  default: {
    user: { findUnique: userFindUnique },
    playlist: {
      findFirst: playlistFindFirst,
      update: playlistUpdate,
      findUnique: playlistFindUnique,
    },
    playlistTrack: {
      update: playlistTrackUpdate,
    },
    $transaction: async (cb: (tx: any) => Promise<unknown>) =>
      cb({
        playlistTrack: { update: playlistTrackUpdate },
        playlist: { update: playlistUpdate, findUnique: playlistFindUnique },
      }),
  },
}));

const buildRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost/api/playlists/123/reorder', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

describe('api/playlists/[id]/reorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue({
      user: { email: 'test@example.com' },
    });
    userFindUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
    playlistFindFirst.mockResolvedValue({
      id: 'p1',
      userId: 'user-1',
      playlistTracks: [
        { id: 'pt1', trackId: 't1', position: 0 },
        { id: 'pt2', trackId: 't2', position: 1 },
      ],
    });
    playlistFindUnique.mockResolvedValue({ id: 'p1', playlistTracks: [] });
  });

  it('rejects missing items', async () => {
    const res = await PATCH(buildRequest({}), { params: { id: 'p1' } });
    expect(res.status).toBe(400);
  });

  it('reorders with valid payload', async () => {
    const res = await PATCH(
      buildRequest({
        items: [
          { trackId: 't2', position: 200 },
          { trackId: 't1', position: 100 },
        ],
      }),
      { params: { id: 'p1' } },
    );
    expect(res.status).toBe(200);
    expect(playlistTrackUpdate).toHaveBeenCalled();
  });
});
