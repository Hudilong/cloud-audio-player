import { Playlist, Track } from '@prisma/client';

export type PlaylistWithTracks = Playlist & {
  playlistTracks: Array<{
    id: string;
    position: number;
    track: Track;
  }>;
};
