'use client';

import Image from 'next/image';
import { getCoverProps } from '../../utils/getCoverSrc';
import { TrackWithCover } from '../../types/trackWithCover';

type CoverImageProps = {
  track?: TrackWithCover | null;
  imageURL?: string | null;
  imageBlurhash?: string | null;
  alt?: string;
  className?: string;
  width: number;
  height: number;
  fill?: boolean;
  sizes?: string;
};

export default function CoverImage({
  track,
  imageURL,
  imageBlurhash,
  alt = 'cover art',
  className,
  width,
  height,
  fill = false,
  sizes,
}: CoverImageProps) {
  const source = track
    ? getCoverProps(track.imageURL, track.imageBlurhash)
    : getCoverProps(imageURL, imageBlurhash);

  const placeholder = source.placeholder === 'blur' ? 'blur' : 'empty';
  const blurDataURL =
    source.placeholder === 'blur' && source.blurDataURL
      ? source.blurDataURL
      : undefined;

  return (
    <Image
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill || undefined}
      sizes={sizes}
      src={source.src}
      alt={alt}
      className={className}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
    />
  );
}
