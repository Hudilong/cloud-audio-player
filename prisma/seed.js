/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const isProduction = process.env.NODE_ENV === 'production';

function parseNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

async function ensureUser(email, name, password, role = 'USER') {
  let user = await prisma.user.findUnique({ where: { email } });
  const hashedPassword = await bcrypt.hash(password, 10);

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
    });
    console.log(`Created ${role.toLowerCase()} user ${email}`);
    return user;
  }

  if (!user.password) {
    user = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
    console.log(`Updated password for ${email}`);
  }

  if (user.role !== role) {
    user = await prisma.user.update({
      where: { email },
      data: { role },
    });
    console.log(`Updated role for ${email} to ${role}`);
  }

  return user;
}

async function main() {
  const seedEmail = process.env.SEED_USER_EMAIL || 'dev@example.com';
  const seedPassword = process.env.SEED_USER_PASSWORD || 'password123';
  const seedAudioKey = process.env.SEED_AUDIO_S3_KEY;
  const allowFakeAudio =
    process.env.SEED_ALLOW_FAKE_AUDIO === 'true' || !isProduction;
  const fakeAudioKey =
    process.env.SEED_FAKE_AUDIO_S3_KEY || 'missing/dev-audio.mp3';
  const seedTrackCount = parseNumber(process.env.SEED_TRACK_COUNT, 5);
  const seedAdminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD || 'changeme-admin';

  // Always ensure the admin account exists
  await ensureUser(seedAdminEmail, 'Admin', seedAdminPassword, 'ADMIN');

  if (isProduction) {
    console.log('Production mode: only seeding admin user');
    return;
  }

  const user = await ensureUser(seedEmail, 'Dev User', seedPassword);

  const audioKeyForSeeds =
    seedAudioKey || (allowFakeAudio ? fakeAudioKey : null);

  if (audioKeyForSeeds) {
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
            s3Key: audioKeyForSeeds,
            userId: user.id,
          },
        });
      }
    }
    console.log(
      `Seeded ${seedTrackCount} test tracks for ${seedEmail} using ${
        seedAudioKey ? 'provided' : 'fake'
      } audio key`,
    );
  } else {
    console.log(
      'No seed audio configured; set SEED_AUDIO_S3_KEY or SEED_ALLOW_FAKE_AUDIO=true to seed test tracks',
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
