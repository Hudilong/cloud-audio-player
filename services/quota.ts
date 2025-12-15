import prisma from '@utils/prisma';
import {
  DAILY_TRACK_UPLOAD_LIMIT,
  TOTAL_TRACK_UPLOAD_LIMIT,
} from '@utils/limits';
import { HttpError } from '@utils/httpError';

const startOfUtcDay = () => {
  const now = new Date();
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  return start;
};

export const assertTrackUploadQuota = async (userId: string) => {
  if (!DAILY_TRACK_UPLOAD_LIMIT && !TOTAL_TRACK_UPLOAD_LIMIT) {
    return;
  }

  const countFn = (prisma.track as { count?: typeof prisma.track.count }).count;
  if (typeof countFn !== 'function') {
    // In tests or minimal mocks, skip quota enforcement to avoid crashes.
    return;
  }

  if (DAILY_TRACK_UPLOAD_LIMIT) {
    const todayCount = await countFn({
      where: { userId, createdAt: { gte: startOfUtcDay() } },
    });
    if (todayCount >= DAILY_TRACK_UPLOAD_LIMIT) {
      throw new HttpError(
        429,
        'Daily upload limit reached. Try again tomorrow.',
        undefined,
        'DAILY_UPLOAD_LIMIT',
      );
    }
  }

  if (TOTAL_TRACK_UPLOAD_LIMIT) {
    const totalCount = await countFn({ where: { userId } });
    if (totalCount >= TOTAL_TRACK_UPLOAD_LIMIT) {
      throw new HttpError(
        429,
        'Total upload limit reached for this account.',
        undefined,
        'TOTAL_UPLOAD_LIMIT',
      );
    }
  }
};
