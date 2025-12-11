import { blurhashToDataURL } from './blurhashPlaceholder';

export function getCoverSrc(imageURL?: string | null) {
  if (!imageURL) return '/default-thumbnail.png';
  if (imageURL.startsWith('http')) return imageURL;
  return `/api/tracks/cover-url?key=${encodeURIComponent(imageURL)}`;
}

export function getCoverSrcForTrack(imageURL?: string | null) {
  return getCoverSrc(imageURL);
}

export function getCoverProps(imageURL?: string | null, imageBlurhash?: string | null) {
  const src = getCoverSrc(imageURL);
  const blurDataURL = blurhashToDataURL(imageBlurhash);
  return {
    src,
    blurDataURL: blurDataURL || undefined,
    placeholder: blurDataURL ? 'blur' : undefined,
  };
}
