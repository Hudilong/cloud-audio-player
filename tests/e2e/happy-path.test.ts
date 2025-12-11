import { describe, expect, it, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as createTrack } from '@/api/tracks/route';
import { PATCH as reorderPlaylist } from '@/api/playlists/[id]/reorder/route';
import { POST as savePlayback, GET as loadPlayback } from '@/api/playback/route';

type Track = {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  genre: string;
  duration: number;
  s3Key: string;
  userId: string;
  imageURL?: string | null;
  imageBlurhash?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

const {
  getServerSessionMock,
  trackCreate,
  trackFindMany,
  trackFindFirst,
  playlistFindFirst,
  playlistTrackUpdate,
  playlistFindUnique,
  playlistUpdate,
  playbackFindUnique,
  playbackUpsert,
  userFindUnique,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  trackCreate: vi.fn(),
  trackFindMany: vi.fn(),
  trackFindFirst: vi.fn(),
  playlistFindFirst: vi.fn(),
  playlistTrackUpdate: vi.fn(),
  playlistFindUnique: vi.fn(),
  playlistUpdate: vi.fn(),
  playbackFindUnique: vi.fn(),
  playbackUpsert: vi.fn(),
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
    track: {
      create: trackCreate,
      findMany: trackFindMany,
      findFirst: trackFindFirst,
    },
    playlist: {
      findFirst: playlistFindFirst,
      findUnique: playlistFindUnique,
      update: playlistUpdate,
    },
    playlistTrack: {
      update: playlistTrackUpdate,
    },
    playbackState: {
      findUnique: playbackFindUnique,
      upsert: playbackUpsert,
    },
    $transaction: async (cb: (tx: any) => Promise<unknown>) =>
      cb({
        playlistTrack: { update: playlistTrackUpdate },
        playlist: { update: playlistUpdate, findUnique: playlistFindUnique },
      }),
  },
}));

const buildRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost/api', {
    method: 'POST',
    body: JSON.stringify(body),
  });

describe('e2e happy path: upload -> cover -> reorder -> resume', () => {
  const user = { id: 'user-1', email: 'test@example.com' };
  let tracks: Track[] = [];
  let playlistTracks: { id: string; trackId: string; position: number }[] = [];
  type PlaybackState = {
    userId: string;
    trackId: string;
    position: number;
    isPlaying: boolean;
    volume: number;
    shuffle: boolean;
    repeat: boolean;
    repeatMode: 'off' | 'queue' | 'track';
    currentTrackIndex: number;
    tracks: { queueTrackIds: string[]; repeatMode: 'off' | 'queue' | 'track' };
    updatedAt?: Date;
  };
  let playbackState: PlaybackState | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue({ user: { email: user.email } });
    userFindUnique.mockResolvedValue(user);

    tracks = [
      {
        id: 'track-1',
        title: 'Demo Track 1',
        artist: 'Demo Artist',
        album: 'Demo',
        genre: 'Demo',
        duration: 180,
        s3Key: 'uploads/demo1.mp3',
        userId: user.id,
        imageURL: 'covers/demo1.webp',
      },
      {
        id: 'track-2',
        title: 'Demo Track 2',
        artist: 'Demo Artist',
        album: 'Demo',
        genre: 'Demo',
        duration: 200,
        s3Key: 'uploads/demo2.mp3',
        userId: user.id,
        imageURL: 'covers/demo2.webp',
      },
    ];
    playlistTracks = [
      { id: 'pt1', trackId: 'track-1', position: 100 },
      { id: 'pt2', trackId: 'track-2', position: 200 },
    ];
    playbackState = null;

    trackCreate.mockImplementation(async ({ data }: { data: Track }) => {
      const newTrack = {
        ...data,
        id: `track-${tracks.length + 1}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      tracks.push(newTrack);
      return newTrack;
    });
    trackFindFirst.mockImplementation(
      async ({ where }: { where: Partial<Track> }) =>
        tracks.find(
          (t) => t.id === where.id && t.userId === where.userId,
        ) || null,
    );
    trackFindMany.mockImplementation(
      async ({ where }: { where: { id?: { in: string[] }; userId: string } }) =>
        tracks.filter(
          (t) =>
            t.userId === where.userId &&
            (!where.id?.in || where.id.in.includes(t.id)),
        ),
    );

    playlistFindFirst.mockImplementation(async () => ({
      id: 'playlist-1',
      userId: user.id,
      playlistTracks,
    }));
    playlistUpdate.mockImplementation(async ({ data }: { data: unknown }) => ({
      id: 'playlist-1',
      ...data,
    }));
    playlistTrackUpdate.mockImplementation(
      async ({ where, data }: { where: { id: string }; data: { position: number } }) => {
        const target = playlistTracks.find((pt) => pt.id === where.id);
        if (target) target.position = data.position;
        return target;
      },
    );
    playlistFindUnique.mockImplementation(async () => ({
      id: 'playlist-1',
      playlistTracks: playlistTracks
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((pt) => ({
          ...pt,
          track: tracks.find((t) => t.id === pt.trackId),
        })),
    }));

    playbackUpsert.mockImplementation(async ({ create, update }) => {
      playbackState = playbackState
        ? { ...playbackState, ...update, updatedAt: new Date() }
        : { ...create, updatedAt: new Date() };
      return playbackState;
    });
    playbackFindUnique.mockImplementation(async ({ where }: { where: { userId: string } }) => {
      if (!playbackState || playbackState.userId !== where.userId) return null;
      return {
        ...playbackState,
        track: tracks.find((t) => t.id === playbackState.trackId),
      };
    });
  });

  it('walks through upload -> reorder -> resume playback', async () => {
    const createRes = await createTrack(
      buildRequest({
        title: 'Uploaded Track',
        artist: 'Uploader',
        album: 'Uploads',
        genre: 'Demo',
        duration: 210,
        s3Key: 'uploads/new-track.mp3',
        imageURL: 'covers/new-track.webp',
        imageBlurhash: 'demo-blur',
      }) as unknown as NextRequest,
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.track.imageURL).toBe('covers/new-track.webp');

    const playbackRes = await savePlayback(
      buildRequest({
        trackId: 'track-2',
        position: 42,
        isPlaying: true,
        volume: 0.7,
        isShuffle: false,
        repeatMode: 'queue',
        currentTrackIndex: 1,
        queueTrackIds: ['track-1', 'track-2'],
      }) as unknown as NextRequest,
    );
    expect(playbackRes.status).toBe(200);

    const reorderRes = await reorderPlaylist(
      new Request('http://localhost/api/playlists/playlist-1/reorder', {
        method: 'PATCH',
        body: JSON.stringify({
          items: [
            { trackId: 'track-2', position: 100 },
            { trackId: 'track-1', position: 200 },
          ],
        }),
      }) as unknown as NextRequest,
      { params: { id: 'playlist-1' } },
    );
    expect(reorderRes.status).toBe(200);
    const reordered = await reorderRes.json();
    const reorderedPlaylist = reordered.playlist as {
      playlistTracks: { id: string; trackId: string; position: number; track: Track }[];
    };
    expect(reorderedPlaylist.playlistTracks.map((pt) => pt.trackId)).toEqual([
      'track-2',
      'track-1',
    ]);

    const resumeRes = await loadPlayback();
    expect(resumeRes.status).toBe(200);
    const resume = await resumeRes.json();
    expect(resume.trackId).toBe('track-2');
    expect(resume.position).toBe(42);
    expect(resume.queue.map((t: Track) => t.id)).toEqual(['track-1', 'track-2']);
  });
});
