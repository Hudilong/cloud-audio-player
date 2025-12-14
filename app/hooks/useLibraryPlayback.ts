'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { LibraryTrack, LibraryTrackKind } from '@app-types/libraryTrack';
import {
  fetchTrackOrder,
  fetchTrackSummaries,
} from '../../services/tracksClient';

type UseLibraryPlaybackParams = {
  library: LibraryTrack[];
  featuredTracks: LibraryTrack[];
  activePlaylistId: string | null;
  getPlaylistTracks: (playlistId: string) => LibraryTrack[];
  queue: LibraryTrack[];
  currentTrackIndex: number;
  isShuffle: boolean;
  applyShuffleToQueue: (
    tracks?: LibraryTrack[],
    anchorIndex?: number,
    options?: { force?: boolean },
  ) => void;
  setQueue: (
    tracks: LibraryTrack[] | ((prev: LibraryTrack[]) => LibraryTrack[]),
  ) => void;
  setCurrentTrackIndex: (value: number) => void;
  setTrack: (track: LibraryTrack) => void;
  setCurrentTime: (value: number) => void;
  setIsPlaying: (value: boolean) => void;
};

export function useLibraryPlayback({
  library,
  featuredTracks,
  activePlaylistId,
  getPlaylistTracks,
  queue,
  currentTrackIndex,
  isShuffle,
  applyShuffleToQueue,
  setQueue,
  setCurrentTrackIndex,
  setTrack,
  setCurrentTime,
  setIsPlaying,
}: UseLibraryPlaybackParams) {
  const sourceTracks = useMemo(
    () => (activePlaylistId ? getPlaylistTracks(activePlaylistId) : library),
    [activePlaylistId, getPlaylistTracks, library],
  );
  const hydratedIdsRef = useRef<Set<string>>(new Set());

  const toPlaceholderTrack = useCallback(
    (id: string, kind: LibraryTrackKind = 'user'): LibraryTrack => ({
      id,
      title: null,
      artist: null,
      album: null,
      genre: null,
      duration: 0,
      s3Key: '',
      imageURL: null,
      imageBlurhash: null,
      kind,
      isFeatured: kind === 'featured',
    }),
    [],
  );

  const hydrateAndMerge = useCallback(
    async (ids: string[]) => {
      const toFetch = ids.filter((id) => id && !hydratedIdsRef.current.has(id));
      if (!toFetch.length) return;

      const detailMap = new Map<string, LibraryTrack>();
      const BATCH_SIZE = 100;
      const batches: string[][] = [];
      for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
        batches.push(toFetch.slice(i, i + BATCH_SIZE));
      }
      const detailResponses = await Promise.all(
        batches.map((batch) => fetchTrackSummaries(batch)),
      );
      detailResponses.forEach((details) => {
        details.forEach((track) => {
          detailMap.set(track.id, track);
          hydratedIdsRef.current.add(track.id);
        });
      });

      if (!detailMap.size) return;

      setQueue((prev) =>
        prev.map((item) => {
          const detail = detailMap.get(item.id);
          return detail ? { ...item, ...detail } : item;
        }),
      );

      setTrack((prev) => {
        if (prev && detailMap.has(prev.id)) {
          return { ...prev, ...detailMap.get(prev.id)! };
        }
        return prev;
      });
    },
    [setQueue, setTrack],
  );

  const handleTrackSelect = async (selectedTrack: LibraryTrack) => {
    // Playlist playback uses already-loaded tracks
    if (activePlaylistId) {
      const playlistTracks = getPlaylistTracks(activePlaylistId);
      if (!playlistTracks.length) return;
      const anchorIndex = Math.max(
        playlistTracks.findIndex((track) => track.id === selectedTrack.id),
        0,
      );

      if (isShuffle) {
        applyShuffleToQueue(playlistTracks, anchorIndex, { force: true });
      } else {
        setQueue(playlistTracks);
        setCurrentTrackIndex(anchorIndex);
      }
      setTrack(playlistTracks[anchorIndex] || selectedTrack);
      setCurrentTime(0);
      setIsPlaying(true);
      return;
    }

    // Library playback: build queue from id-only order and hydrate lazily
    const ids = await fetchTrackOrder({ shuffle: isShuffle });
    const hasSelected = ids.includes(selectedTrack.id);
    const orderIds = hasSelected ? ids : [selectedTrack.id, ...ids];
    const anchorIndex = Math.max(orderIds.indexOf(selectedTrack.id), 0);

    const placeholders = orderIds.map((id) => toPlaceholderTrack(id, 'user'));

    if (isShuffle) {
      applyShuffleToQueue(placeholders, anchorIndex, { force: true });
    } else {
      setQueue(placeholders);
      setCurrentTrackIndex(anchorIndex);
    }

    setTrack(selectedTrack);
    setCurrentTime(0);
    setIsPlaying(true);

    // Hydrate current and the next couple of tracks for UI playback smoothness
    const sliceIds = orderIds.slice(anchorIndex, anchorIndex + 3);
    hydrateAndMerge(sliceIds);
    // Prefetch the visible queue chunk to avoid "Untitled" placeholders
    const PREFETCH_LIMIT = 200;
    hydrateAndMerge(orderIds.slice(0, PREFETCH_LIMIT));
  };

  const handleAddTrackToQueue = (selectedTrack: LibraryTrack) => {
    setQueue((prevQueue) => [...prevQueue, selectedTrack]);
  };

  const handlePlayNext = (selectedTrack: LibraryTrack) => {
    setQueue((prevQueue) => {
      if (prevQueue.length === 0) return [selectedTrack];
      const nowPlaying = prevQueue[0];
      const remaining = prevQueue
        .slice(1)
        .filter((track) => track.id !== selectedTrack.id);
      return [nowPlaying, selectedTrack, ...remaining];
    });
  };

  const handleFeaturedSelect = (selectedTrack: LibraryTrack) => {
    if (!featuredTracks.length) return;
    const index = featuredTracks.findIndex(
      (track) => track.id === selectedTrack.id,
    );
    const anchorIndex = Math.max(index, 0);

    if (isShuffle) {
      applyShuffleToQueue(featuredTracks, anchorIndex, { force: true });
    } else {
      setQueue(featuredTracks);
      setCurrentTrackIndex(anchorIndex);
    }

    setTrack(featuredTracks[anchorIndex] || selectedTrack);
    setCurrentTime(0);
    setIsPlaying(true);
    hydrateAndMerge(
      featuredTracks.slice(anchorIndex, anchorIndex + 2).map((t) => t.id),
    );
  };

  const handleFeaturedAddToQueue = (selectedTrack: LibraryTrack) => {
    setQueue((prevQueue) => [...prevQueue, selectedTrack]);
  };

  const handleFeaturedPlayNext = (selectedTrack: LibraryTrack) => {
    setQueue((prevQueue) => {
      if (prevQueue.length === 0) return [selectedTrack];
      const nowPlaying = prevQueue[0];
      const remaining = prevQueue
        .slice(1)
        .filter((track) => track.id !== selectedTrack.id);
      return [nowPlaying, selectedTrack, ...remaining];
    });
  };

  useEffect(() => {
    const windowSize = 6;
    const targets = queue
      .slice(currentTrackIndex, currentTrackIndex + windowSize)
      .filter(
        (track) =>
          track &&
          (!track.title ||
            !track.s3Key ||
            track.duration === 0 ||
            track.artist === null),
      );

    if (!targets.length) return;

    hydrateAndMerge(targets.map((track) => track.id));
  }, [currentTrackIndex, hydrateAndMerge, queue]);

  return {
    sourceTracks,
    handleTrackSelect,
    handleAddTrackToQueue,
    handlePlayNext,
    handleFeaturedSelect,
    handleFeaturedAddToQueue,
    handleFeaturedPlayNext,
  };
}
