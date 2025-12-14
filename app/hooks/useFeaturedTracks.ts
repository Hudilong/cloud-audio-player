'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { LibraryTrack } from '@app-types/libraryTrack';
import { getFriendlyMessage, parseApiError } from '@utils/apiError';
import { useToast } from '../context/ToastContext';

type UseFeaturedTracksOptions = {
  enabled: boolean;
  isAdmin: boolean;
};

export function useFeaturedTracks({
  enabled,
  isAdmin,
}: UseFeaturedTracksOptions) {
  const { notify } = useToast();
  const [featuredTracks, setFeaturedTracks] = useState<LibraryTrack[]>([]);
  const [featuredError, setFeaturedError] = useState<string | null>(null);
  const [featuringTrackId, setFeaturingTrackId] = useState<string | null>(null);

  const fetchFeatured = useCallback(async () => {
    try {
      const res = await fetch('/api/featured-tracks');
      const data = await res.json();
      if (!res.ok) {
        const apiError = await parseApiError(res, data);
        throw new Error(getFriendlyMessage(apiError));
      }
      const normalized: LibraryTrack[] = (data.tracks || []).map(
        (track: LibraryTrack) => ({
          ...track,
          kind: 'featured',
          isFeatured: true,
        }),
      );
      const ordered = [...normalized].sort(
        (a, b) => (Number(a.order || 0) || 0) - (Number(b.order || 0) || 0),
      );
      setFeaturedTracks(ordered);
      setFeaturedError(null);
    } catch (err) {
      setFeaturedError(getFriendlyMessage(err as Error));
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      fetchFeatured();
    }
  }, [enabled, fetchFeatured]);

  const isTrackFeatured = useMemo(
    () => (track: LibraryTrack) =>
      Boolean(track.isFeatured) ||
      featuredTracks.some((item) => item.id === track.id),
    [featuredTracks],
  );

  const addToFeatured = useCallback(
    async (track: LibraryTrack) => {
      if (!isAdmin) return;
      setFeaturingTrackId(track.id);
      try {
        const res = await fetch('/api/featured-tracks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackId: track.id }),
        });
        const data = await res.json();
        if (!res.ok) {
          const apiError = await parseApiError(res, data);
          throw new Error(getFriendlyMessage(apiError));
        }
        const featuredTrack: LibraryTrack = {
          ...(data.track || track),
          kind: 'featured',
          isFeatured: true,
        };

        setFeaturedTracks((prev) => {
          const exists = prev.some((item) => item.id === featuredTrack.id);
          if (exists) {
            return prev.map((item) =>
              item.id === featuredTrack.id ? featuredTrack : item,
            );
          }
          return [...prev, featuredTrack];
        });
        setFeaturedError(null);
      } catch (err) {
        const message = getFriendlyMessage(err as Error);
        setFeaturedError(message);
        notify(message, { variant: 'error' });
      } finally {
        setFeaturingTrackId(null);
      }
    },
    [isAdmin, notify],
  );

  return {
    featuredTracks,
    featuredError,
    featuringTrackId,
    fetchFeatured,
    setFeaturedTracks,
    setFeaturedError,
    isTrackFeatured,
    addToFeatured,
  };
}
