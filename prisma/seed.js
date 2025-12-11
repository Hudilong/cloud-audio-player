/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

function parseNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function getDemoTracks() {
  if (process.env.DEMO_TRACKS) {
    try {
      const parsed = JSON.parse(process.env.DEMO_TRACKS);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('DEMO_TRACKS is not valid JSON; skipping');
    }
  }

  const track1Key = process.env.DEMO_TRACK_1_KEY;
  const track2Key = process.env.DEMO_TRACK_2_KEY;

  const tracks = [];
  if (track1Key) {
    tracks.push({
      title: process.env.DEMO_TRACK_1_TITLE || 'Demo Track 1',
      artist: process.env.DEMO_TRACK_1_ARTIST || 'Demo Artist 1',
      album: process.env.DEMO_TRACK_1_ALBUM || 'Demo Album',
      genre: process.env.DEMO_TRACK_1_GENRE || 'Demo',
      duration: parseNumber(process.env.DEMO_TRACK_1_DURATION, 180),
      s3Key: track1Key,
      imageURL: process.env.DEMO_TRACK_1_IMAGE_URL || null,
      imageBlurhash: process.env.DEMO_TRACK_1_IMAGE_BLURHASH || null,
    });
  }
  if (track2Key) {
    tracks.push({
      title: process.env.DEMO_TRACK_2_TITLE || 'Demo Track 2',
      artist: process.env.DEMO_TRACK_2_ARTIST || 'Demo Artist 2',
      album: process.env.DEMO_TRACK_2_ALBUM || 'Demo Album',
      genre: process.env.DEMO_TRACK_2_GENRE || 'Demo',
      duration: parseNumber(process.env.DEMO_TRACK_2_DURATION, 200),
      s3Key: track2Key,
      imageURL: process.env.DEMO_TRACK_2_IMAGE_URL || null,
      imageBlurhash: process.env.DEMO_TRACK_2_IMAGE_BLURHASH || null,
    });
  }

  return tracks;
}

async function seedDemoTracksForUser(userId) {
  const demoTracks = getDemoTracks();
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
    await prisma.track.createMany({ data: toCreate });
  }
}

async function main() {
  const seedEmail = process.env.SEED_USER_EMAIL || 'dev@example.com';
  const seedPassword = process.env.SEED_USER_PASSWORD || 'password123';
  const seedAudioKey = process.env.SEED_AUDIO_S3_KEY;
  const seedTrackCount = parseNumber(process.env.SEED_TRACK_COUNT, 5);

  let user = await prisma.user.findUnique({ where: { email: seedEmail } });
  if (!user) {
    const hashedPassword = await bcrypt.hash(seedPassword, 10);
    user = await prisma.user.create({
      data: {
        email: seedEmail,
        password: hashedPassword,
        name: 'Dev User',
      },
    });
    console.log(`Created dev user ${seedEmail}`);
  }

  if (seedAudioKey) {
    for (let i = 1; i <= seedTrackCount; i += 1) {
      const title = `Test ${i}`;
      const artist = `Artist ${i}`;
      const existing = await prisma.track.findFirst({
        where: { userId: user.id, title, artist },
      });
      if (!existing) {
        await prisma.track.create({
          data: {
            title,
            artist,
            album: 'Dev Album',
            genre: 'Dev',
            duration: 180 + i,
            s3Key: seedAudioKey,
            userId: user.id,
          },
        });
      }
    }
    console.log(`Seeded ${seedTrackCount} test tracks for ${seedEmail}`);
  } else {
    console.log(
      'SEED_AUDIO_S3_KEY not set; skipping test track seeding (set a real s3Key to enable)',
    );
  }

  await seedDemoTracksForUser(user.id);
  console.log('Seeded demo tracks (if configured) for dev user');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
