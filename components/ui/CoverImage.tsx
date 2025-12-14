'use client';

import Image from 'next/image';
import React, { useEffect, useMemo, useState } from 'react';
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

const coverCache = new Map<string, string>();

function cacheBust(url: string) {
  if (!url) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}cb=${Date.now()}`;
}

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
  const source = useMemo(
    () =>
      track
        ? getCoverProps(track.imageURL, track.imageBlurhash)
        : getCoverProps(imageURL, imageBlurhash),
    [track, imageURL, imageBlurhash],
  );

  const cacheKey = useMemo(() => {
    if (track?.id) {
      let updated: number | string = '';
      if (track.updatedAt instanceof Date) {
        updated = track.updatedAt.getTime();
      } else if (track.updatedAt) {
        updated = new Date(track.updatedAt).getTime();
      }
      return `${track.id}-${updated}`;
    }
    return source.src;
  }, [source.src, track?.id, track?.updatedAt]);

  const [currentSrc, setCurrentSrc] = useState(source.src);
  const [hasRetried, setHasRetried] = useState(false);
  const resolvedSizes =
    sizes ||
    (fill
      ? '(min-width: 1024px) 240px, (min-width: 640px) 45vw, 90vw'
      : undefined);

  const placeholder = source.placeholder === 'blur' ? 'blur' : 'empty';
  const blurDataURL =
    source.placeholder === 'blur' && source.blurDataURL
      ? source.blurDataURL
      : undefined;

  useEffect(() => {
    setHasRetried(false);
    setCurrentSrc((prev) => {
      const cached = cacheKey ? coverCache.get(cacheKey) : null;
      if (cached && cached !== prev) return cached;
      return source.src;
    });
  }, [cacheKey, source.src]);

  const handleLoad = () => {
    if (cacheKey) {
      coverCache.set(cacheKey, currentSrc);
    }
  };

  const handleError = () => {
    if (hasRetried) return;
    const refreshed = cacheBust(source.src);
    setHasRetried(true);
    setCurrentSrc(refreshed);
    if (cacheKey) {
      coverCache.set(cacheKey, refreshed);
    }
  };

  return (
    <Image
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill || undefined}
      sizes={resolvedSizes}
      src={currentSrc}
      alt={alt}
      className={className}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
}
