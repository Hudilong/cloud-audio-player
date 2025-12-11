import prisma from './prisma';

type DemoTrackInput = {
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  duration: number;
  s3Key: string;
  imageURL?: string | null;
  imageBlurhash?: string | null;
};

const parseNumber = (value: string | undefined, fallback: number) => {
  const num = value ? Number(value) : NaN;
  return Number.isFinite(num) ? num : fallback;
};

function parseDemoTracksFromEnv(): DemoTrackInput[] {
  const track1Key = process.env.DEMO_TRACK_1_KEY;
  const track2Key = process.env.DEMO_TRACK_2_KEY;
  const track1: DemoTrackInput | null = track1Key
    ? {
        title: process.env.DEMO_TRACK_1_TITLE || 'Demo Track 1',
        artist: process.env.DEMO_TRACK_1_ARTIST || 'Demo Artist 1',
        album: process.env.DEMO_TRACK_1_ALBUM || 'Demo Album',
        genre: process.env.DEMO_TRACK_1_GENRE || 'Demo',
        duration: parseNumber(process.env.DEMO_TRACK_1_DURATION, 180),
        s3Key: track1Key,
        imageURL: process.env.DEMO_TRACK_1_IMAGE_URL || null,
        imageBlurhash: process.env.DEMO_TRACK_1_IMAGE_BLURHASH || null,
      }
    : null;

  const track2: DemoTrackInput | null = track2Key
    ? {
        title: process.env.DEMO_TRACK_2_TITLE || 'Demo Track 2',
        artist: process.env.DEMO_TRACK_2_ARTIST || 'Demo Artist 2',
        album: process.env.DEMO_TRACK_2_ALBUM || 'Demo Album',
        genre: process.env.DEMO_TRACK_2_GENRE || 'Demo',
        duration: parseNumber(process.env.DEMO_TRACK_2_DURATION, 200),
        s3Key: track2Key,
        imageURL: process.env.DEMO_TRACK_2_IMAGE_URL || null,
        imageBlurhash: process.env.DEMO_TRACK_2_IMAGE_BLURHASH || null,
      }
    : null;

  return [track1, track2].filter(Boolean) as DemoTrackInput[];
}

export function getDemoTracksConfig(): DemoTrackInput[] {
  return parseDemoTracksFromEnv();
}

export async function seedDemoTracksForUser(userId: string) {
  const demoTracks = getDemoTracksConfig();
  if (!demoTracks.length) return;

  const existing = await prisma.track.findMany({
    where: { userId, s3Key: { in: demoTracks.map((t) => t.s3Key) } },
    select: { s3Key: true },
  });
  const existingKeys = new Set(existing.map((t) => t.s3Key));

  const toCreate = demoTracks
    .filter((track) => !existingKeys.has(track.s3Key))
    .map((track) => ({
      ...track,
      userId,
    }));

  if (toCreate.length) {
    await prisma.track.createMany({
      data: toCreate,
    });
  }
}
