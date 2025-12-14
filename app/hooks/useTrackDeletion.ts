'use client';

import { useCallback } from 'react';
import { LibraryTrack } from '@app-types/libraryTrack';
import { getFriendlyMessage, parseApiError } from '@utils/apiError';

type PlayerControls = {
  queue: LibraryTrack[];
  currentTrack: LibraryTrack | null;
  currentTrackIndex: number;
  setQueue: (tracks: LibraryTrack[]) => void;
  setTrack: (track: LibraryTrack | null) => void;
  setIsPlaying: (value: boolean) => void;
  setCurrentTime: (value: number) => void;
  setCurrentTrackIndex: (value: number) => void;
};

type UseTrackDeletionOptions = {
  isTrackFeatured: (track: LibraryTrack) => boolean;
  onFeaturedRemove: (trackId: string) => void;
  onFeaturedError: (message: string | null) => void;
  onLibraryUpdate: (
    updater: (tracks: LibraryTrack[]) => LibraryTrack[],
  ) => void;
  onRemoveFromPlaylists: (trackId: string) => void;
  player: PlayerControls;
  setError: (message: string | null) => void;
};

export function useTrackDeletion({
  isTrackFeatured,
  onFeaturedRemove,
  onFeaturedError,
  onLibraryUpdate,
  onRemoveFromPlaylists,
  player,
  setError,
}: UseTrackDeletionOptions) {
  const handleDeleteTrack = useCallback(
    async (selectedTrack: LibraryTrack) => {
      if (isTrackFeatured(selectedTrack)) {
        // eslint-disable-next-line no-alert -- quick confirmation before destructive action
        const confirmed = window.confirm(
          'This track is featured and visible to everyone. Deleting it will also remove it from Featured. Delete anyway?',
        );
        if (!confirmed) return;
        try {
          const resp = await fetch(`/api/featured-tracks/${selectedTrack.id}`, {
            method: 'DELETE',
          });
          const body = await resp.json().catch(() => null);
          if (!resp.ok) {
            const apiError = await parseApiError(resp, body);
            throw new Error(getFriendlyMessage(apiError));
          }
          onFeaturedRemove(selectedTrack.id);
        } catch (err) {
          onFeaturedError(getFriendlyMessage(err as Error));
          return;
        }
      }

      try {
        const res = await fetch(
          `/api/tracks/delete-url?id=${selectedTrack.id}`,
        );
        const deletePayload = await res.json();
        const { deleteURL, coverDeleteURLs = [], error } = deletePayload;

        if (!res.ok || error || !deleteURL) {
          const apiError = !res.ok ? await parseApiError(res) : null;
          throw new Error(
            getFriendlyMessage(
              apiError ||
                new Error(error || 'Failed to prepare track deletion.'),
            ),
          );
        }

        const deleteRequests = [
          fetch(deleteURL, {
            method: 'DELETE',
          }),
          ...coverDeleteURLs.map((url: string) =>
            fetch(url, {
              method: 'DELETE',
            }),
          ),
        ];

        const storageResponses = await Promise.all(deleteRequests);
        const storageFailed = storageResponses.some((resp) => !resp.ok);
        if (storageFailed) {
          throw new Error('Failed to delete the file from storage.');
        }

        const deleteTrackResponse = await fetch(
          `/api/tracks/${selectedTrack.id}`,
          {
            method: 'DELETE',
          },
        );

        const deleteTrackData = await deleteTrackResponse.json();

        if (!deleteTrackResponse.ok) {
          const apiError = await parseApiError(
            deleteTrackResponse,
            deleteTrackData,
          );
          throw new Error(getFriendlyMessage(apiError));
        }

        onLibraryUpdate((prevLibrary) =>
          prevLibrary.filter((item) => item.id !== selectedTrack.id),
        );
        onRemoveFromPlaylists(selectedTrack.id);
        setError(null);

        const {
          queue,
          setQueue,
          currentTrack,
          currentTrackIndex,
          setTrack,
          setIsPlaying,
          setCurrentTrackIndex,
          setCurrentTime,
        } = player;

        const removedIndex = queue.findIndex(
          (item) => item.id === selectedTrack.id,
        );
        const filteredQueue = queue.filter(
          (item) => item.id !== selectedTrack.id,
        );

        if (removedIndex !== -1) {
          setQueue(filteredQueue);

          if (currentTrack?.id === selectedTrack.id) {
            if (filteredQueue.length === 0) {
              setTrack(null);
              setIsPlaying(false);
              setCurrentTime(0);
              setCurrentTrackIndex(0);
            } else {
              const nextIndex = Math.min(
                removedIndex,
                filteredQueue.length - 1,
              );
              setTrack(filteredQueue[nextIndex]);
              setCurrentTrackIndex(nextIndex);
              setCurrentTime(0);
              setIsPlaying(false);
            }
          } else if (removedIndex < currentTrackIndex) {
            setCurrentTrackIndex(Math.max(currentTrackIndex - 1, 0));
          }
        }
      } catch (deleteError) {
        setError(getFriendlyMessage(deleteError as Error));
      }
    },
    [
      isTrackFeatured,
      onFeaturedRemove,
      onFeaturedError,
      onLibraryUpdate,
      onRemoveFromPlaylists,
      player,
      setError,
    ],
  );

  return { handleDeleteTrack };
}
