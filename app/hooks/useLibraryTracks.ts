'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LibraryTrack } from '@app-types/libraryTrack';
import { useToast } from '../context/ToastContext';
import { fetchLibraryTracks } from '../../services/tracksClient';

type FetchOptions = {
  cursor?: string | null;
  append?: boolean;
};

type UseLibraryTracksOptions = {
  enabled: boolean;
  infiniteScrollEnabled: boolean;
};

export function useLibraryTracks({
  enabled,
  infiniteScrollEnabled,
}: UseLibraryTracksOptions) {
  const { notify } = useToast();
  const [library, setLibrary] = useState<LibraryTrack[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingAllRef = useRef(false);

  const mergeUniqueTracks = useCallback(
    (incoming: LibraryTrack[], existing: LibraryTrack[] = []) => {
      const seen = new Set<string>();
      return [...existing, ...incoming].filter((item: LibraryTrack) => {
        if (!item.id) return false;
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    },
    [],
  );

  const fetchTracks = useCallback(
    async ({ cursor, append }: FetchOptions = {}) => {
      if (!enabled) return;
      if (append) {
        setLoadingMore(true);
      } else {
        setInitialLoading(true);
      }

      try {
        const { tracks, nextCursor: next } = await fetchLibraryTracks(cursor);
        setLibrary((prev) => {
          const base = append ? mergeUniqueTracks(tracks, prev) : tracks;
          return mergeUniqueTracks(base);
        });
        setNextCursor(next);
        setHasMore(Boolean(next));
        setError(null);
      } catch (err) {
        const message = (err as Error).message || 'Failed to load tracks';
        setError(message);
        notify(message, { variant: 'error' });
      } finally {
        setInitialLoading(false);
        setLoadingMore(false);
      }
    },
    [enabled, mergeUniqueTracks, notify],
  );

  const refreshLibrary = useCallback(() => {
    if (!enabled) return;
    setNextCursor(null);
    setHasMore(true);
    fetchTracks();
  }, [enabled, fetchTracks]);

  const loadAllLibrary = useCallback(async () => {
    if (!enabled) return library;
    if (loadingAllRef.current) return library;
    loadingAllRef.current = true;
    try {
      let cursor = nextCursor;
      let accumulated = [...library];

      // If nothing is loaded yet, grab the first page before walking cursors.
      if (accumulated.length === 0 && cursor === null) {
        const { tracks, nextCursor: firstNext } = await fetchLibraryTracks(
          undefined,
          200,
        );
        accumulated = mergeUniqueTracks(tracks, accumulated);
        cursor = firstNext;
      }

      const walkCursor = async (
        cursorToUse: string | null,
        acc: LibraryTrack[],
      ): Promise<{
        accumulated: LibraryTrack[];
        finalCursor: string | null;
      }> => {
        if (!cursorToUse) {
          return { accumulated: acc, finalCursor: cursorToUse };
        }

        const { tracks, nextCursor: next } = await fetchLibraryTracks(
          cursorToUse,
          200,
        );
        const merged = mergeUniqueTracks(tracks, acc);

        return walkCursor(next, merged);
      };

      const { accumulated: completeLibrary, finalCursor } = await walkCursor(
        cursor,
        accumulated,
      );

      setLibrary(completeLibrary);
      setNextCursor(finalCursor);
      setHasMore(Boolean(finalCursor));

      return completeLibrary;
    } catch (err) {
      const message = (err as Error).message || 'Failed to load tracks';
      setError(message);
      notify(message, { variant: 'error' });
      return library;
    } finally {
      loadingAllRef.current = false;
    }
  }, [enabled, library, mergeUniqueTracks, nextCursor, notify]);

  useEffect(() => {
    if (enabled) {
      setNextCursor(null);
      setHasMore(true);
      fetchTracks();
    }
  }, [enabled, fetchTracks]);

  useEffect(() => {
    if (
      !enabled ||
      !infiniteScrollEnabled ||
      !hasMore ||
      loadingMore ||
      initialLoading
    ) {
      return undefined;
    }

    const node = loadMoreRef.current;
    if (!node) return undefined;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !loadingMore) {
            fetchTracks({ cursor: nextCursor, append: true });
          }
        });
      },
      { rootMargin: '200px' },
    );

    observerRef.current.observe(node);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [
    enabled,
    infiniteScrollEnabled,
    fetchTracks,
    hasMore,
    initialLoading,
    loadingMore,
    nextCursor,
  ]);

  return {
    library,
    setLibrary,
    error,
    setError,
    initialLoading,
    loadingMore,
    hasMore,
    loadMoreRef,
    refreshLibrary,
    loadAllLibrary,
  };
}
