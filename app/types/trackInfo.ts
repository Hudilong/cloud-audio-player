import { Track } from '@prisma/client';

export type TrackInfo = Omit<
  Track,
  's3Key' | 'userId' | 'id' | 'createdAt' | 'updatedAt'
>;
