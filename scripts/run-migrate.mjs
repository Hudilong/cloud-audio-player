#!/usr/bin/env node

import { execSync } from 'node:child_process';
import net from 'node:net';

const allowSkip = process.argv.includes('--allow-skip');
const skipFlag = process.env.SKIP_PRISMA_MIGRATE === 'true';
const startupDelaySeconds = Number(process.env.STARTUP_DELAY_SECONDS || '0');
const label = allowSkip ? '[postbuild]' : '[startup]';

const exitSkip = (message) => {
  console.log(`${label} ${message}`);
  process.exit(0);
};

if (skipFlag) {
  exitSkip('Skipping Prisma migrate deploy (SKIP_PRISMA_MIGRATE=true). Remember to run migrations before serving traffic.');
}

if (!Number.isNaN(startupDelaySeconds) && startupDelaySeconds > 0) {
  console.log(`${label} Waiting ${startupDelaySeconds}s before running migrations...`);
  await new Promise((resolve) => setTimeout(resolve, startupDelaySeconds * 1000));
}

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  const message = 'DATABASE_URL is not set; cannot run Prisma migrate deploy.';
  if (allowSkip) {
    exitSkip(message);
  }
  console.error(`${label} ${message}`);
  process.exit(1);
}

let parsed;

try {
  parsed = new URL(dbUrl);
} catch (error) {
  const message = `Invalid DATABASE_URL, received: ${dbUrl}`;
  if (allowSkip) {
    exitSkip(message);
  }
  console.error(`${label} ${message}`);
  process.exit(1);
}

const host = parsed.hostname;
const port = Number(parsed.port) || 5432;

const reachable = await new Promise((resolve) => {
  const socket = net.connect({ host, port, timeout: 2000 }, () => {
    socket.end();
    resolve(true);
  });

  socket.on('error', () => resolve(false));
  socket.on('timeout', () => {
    socket.destroy();
    resolve(false);
  });
});

if (!reachable) {
  const message = `Cannot reach database at ${host}:${port}; Prisma migrate deploy skipped.`;
  if (allowSkip) {
    exitSkip(message);
  }
  console.error(`${label} ${message}`);
  process.exit(1);
}

try {
  execSync('prisma migrate deploy', { stdio: 'inherit' });
  console.log(`${label} Prisma migrate deploy completed.`);
} catch (error) {
  if (allowSkip) {
    exitSkip(`Prisma migrate deploy failed (${error.status ?? 1}); continuing. Run migrations before starting the app.`);
  }
  console.error(`${label} Prisma migrate deploy failed.`);
  process.exit(error.status ?? 1);
}
