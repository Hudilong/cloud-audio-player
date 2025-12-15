import { LibraryTrack } from './libraryTrack';

export type TrackWithCover = LibraryTrack & {
  imageURL?: string | null;
  imageBlurhash?: string | null;
};
