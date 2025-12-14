export type LibraryTrackKind = 'user' | 'featured';

export type LibraryTrack = {
  id: string;
  title: string | null;
  artist: string | null;
  album: string | null;
  genre: string | null;
  duration: number;
  s3Key: string;
  imageURL: string | null;
  imageBlurhash: string | null;
  userId?: string | null;
  isFeatured?: boolean;
  order?: number;
  kind: LibraryTrackKind;
  createdAt?: Date;
  updatedAt?: Date;
};
