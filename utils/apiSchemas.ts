import { z } from 'zod';

export const trackBaseSchema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
  album: z.string().optional().nullable(),
  duration: z.number().int().positive(),
  s3Key: z.string().min(1),
  genre: z.string().min(1),
  imageURL: z.string().min(1).optional().nullable(),
  imageBlurhash: z.string().min(1).optional().nullable(),
});

export const trackCreateSchema = trackBaseSchema;
export const trackUpdateSchema = trackBaseSchema;

export const playbackUpdateSchema = z.object({
  trackId: z.string().min(1),
  trackKind: z.enum(['user', 'featured']).optional(),
  position: z.number().nonnegative(),
  isPlaying: z.boolean().optional(),
  volume: z.number().min(0).max(1).optional(),
  isShuffle: z.boolean().optional(),
  repeatMode: z.enum(['off', 'queue', 'track']).optional(),
  currentTrackIndex: z.number().int().nonnegative().optional(),
  queue: z
    .array(
      z.object({
        id: z.string().min(1),
        kind: z.enum(['user', 'featured']),
      }),
    )
    .optional(),
  queueTrackIds: z.array(z.string().min(1)).optional(),
});

export const playlistReorderSchema = z.object({
  items: z
    .array(
      z.object({
        trackId: z.string().min(1),
        kind: z.enum(['user', 'featured']).optional(),
        position: z.number().int().optional(),
      }),
    )
    .min(1),
});

export const featuredAddSchema = z.object({
  trackId: z.string().min(1),
  position: z.number().int().optional(),
});

export type TrackCreateBody = z.infer<typeof trackCreateSchema>;
export type TrackUpdateBody = z.infer<typeof trackUpdateSchema>;
export type PlaybackUpdateBody = z.infer<typeof playbackUpdateSchema>;
export type PlaylistReorderBody = z.infer<typeof playlistReorderSchema>;
export type FeaturedAddBody = z.infer<typeof featuredAddSchema>;
