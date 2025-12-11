import { Track } from '@prisma/client';

export type TrackWithCover = Track & {
  imageURL?: string | null;
  imageBlurhash?: string | null;
};
