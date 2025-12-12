'use client';

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Track } from '@prisma/client';
import { LibraryTrack } from '@app-types/libraryTrack';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PlayerContext } from '@/context/PlayerContext';
import { uploadCoverVariantsWithBlurhash } from '@services/storage/coverService';
import TrackListView from '@components/tracks/TrackListView';
import PlaylistPickerModal from '@components/playlist/PlaylistPickerModal';
import FileUploadForm from '@components/forms/FileUploadForm';
import LibraryHeader from '@components/library/LibraryHeader';
import PlaylistGrid from '@components/library/PlaylistGrid';
import GlassModal from '@components/ui/GlassModal';
import EmptyState from '@components/library/EmptyState';
import { getCoverSrc } from '@utils/getCoverSrc';
import { readFileAsDataURL } from '@utils/imageProcessing';
import { usePlaylistManager } from '../hooks/usePlaylistManager';
import { useTrackUpload } from '../hooks/useTrackUpload';

export default function Library(): JSX.Element {
  const { status, data: session } = useSession();
  const router = useRouter();
  const playerContext = useContext(PlayerContext);
  const isAdmin = status === 'authenticated' && session?.user?.role === 'ADMIN';
  const [library, setLibrary] = useState<LibraryTrack[]>([]);
  const [errorDisplay, setErrordisplay] = useState<string | null>(null);
  const [featuredTracks, setFeaturedTracks] = useState<LibraryTrack[]>([]);
  const [featuredError, setFeaturedError] = useState<string | null>(null);
  const [featuringTrackId, setFeaturingTrackId] = useState<string | null>(null);

  const {
    playlists,
    viewMode,
    setViewMode,
    activePlaylistFilter,
    setActivePlaylistFilter,
    playlistModalOpen,
    createPlaylistOpen,
    playlistLoading,
    playlistError,
    playlistName,
    trackToAdd,
    setPlaylistName,
    setCreatePlaylistOpen,
    openPlaylistModal,
    closePlaylistModal,
    getPlaylistTracks,
    addTrackToPlaylist,
    createPlaylist,
    deletePlaylist,
    removeTrackFromPlaylists,
    defaultPlaylistFilter,
    setPlaylistError,
    reorderPlaylistTracks,
    fetchPlaylists,
  } = usePlaylistManager(status);

  const fetchTracks = useCallback(async () => {
    try {
      const res = await fetch('/api/tracks');

      if (!res.ok) {
        throw new Error('Failed to fetch tracks. Please try again later.');
      }

      const data = await res.json();
      const normalized = (data.tracks || []).map(
        (track: Track): LibraryTrack => ({
          ...track,
          isFeatured: Boolean((track as { isFeatured?: boolean }).isFeatured),
          kind: (track as { isFeatured?: boolean }).isFeatured
            ? 'featured'
            : 'user',
        }),
      );
      setLibrary(normalized);
      setErrordisplay(null);
    } catch (error) {
      setErrordisplay(
        error instanceof Error ? error.message : 'Something went wrong.',
      );
    }
  }, []);

  const fetchFeatured = useCallback(async () => {
    try {
      const res = await fetch('/api/default-tracks');
      if (!res.ok) {
        throw new Error('Failed to load featured tracks.');
      }
      const data = await res.json();
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
      setFeaturedError(
        err instanceof Error ? err.message : 'Failed to load featured tracks.',
      );
    }
  }, []);

  const {
    uploadModalOpen,
    selectedFile,
    trackInfo,
    coverFile,
    coverPreview,
    uploading,
    uploadError,
    openUploadModal,
    closeUploadModal,
    handleFileChange,
    handleInputChange,
    handleCoverChange,
    clearCover,
    handleUploadSubmit,
    setUploadError,
  } = useTrackUpload({
    onSuccess: () => {
      fetchTracks();
      setViewMode('songs');
    },
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<LibraryTrack | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    artist: '',
    album: '',
    genre: '',
  });
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setRedirecting(true);
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTracks();
    }
  }, [fetchTracks, status]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchFeatured();
    }
  }, [fetchFeatured, status]);

  if (!playerContext) {
    throw new Error('Library must be used within a PlayerProvider');
  }

  const {
    track: currentTrack,
    queue,
    currentTrackIndex,
    setTrack,
    setCurrentTime,
    setIsPlaying,
    setCurrentTrackIndex,
    setQueue,
  } = playerContext;

  const displayedTracks = useMemo(
    () =>
      activePlaylistFilter.id
        ? getPlaylistTracks(activePlaylistFilter.id)
        : library,
    [activePlaylistFilter.id, getPlaylistTracks, library],
  );

  const handleTrackSelect = (selectedTrack: LibraryTrack) => {
    const sourceTracks = activePlaylistFilter.id
      ? getPlaylistTracks(activePlaylistFilter.id)
      : library;
    setQueue(sourceTracks);
    const index = sourceTracks.findIndex(
      (track) => track.id === selectedTrack.id,
    );
    setCurrentTrackIndex(Math.max(index, 0));
    setTrack(selectedTrack);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleAddTrackToQueue = (selectedTrack: LibraryTrack) => {
    setQueue((prevQueue) => [...prevQueue, selectedTrack]);
  };

  const handlePlayNext = (selectedTrack: LibraryTrack) => {
    setQueue((prevQueue) => {
      if (prevQueue.length === 0) return [selectedTrack];
      const currentPlayingIndex = 0;
      const nowPlaying = prevQueue[currentPlayingIndex];
      const remaining = prevQueue
        .slice(currentPlayingIndex + 1)
        .filter((track) => track.id !== selectedTrack.id);
      return [nowPlaying, selectedTrack, ...remaining];
    });
  };

  const handleFeaturedSelect = (selectedTrack: LibraryTrack) => {
    const sourceTracks = featuredTracks;
    if (!sourceTracks.length) return;
    setQueue(sourceTracks);
    const index = sourceTracks.findIndex(
      (track) => track.id === selectedTrack.id,
    );
    setCurrentTrackIndex(Math.max(index, 0));
    setTrack(selectedTrack);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleFeaturedAddToQueue = (selectedTrack: LibraryTrack) => {
    setQueue((prevQueue) => [...prevQueue, selectedTrack]);
  };

  const handleFeaturedPlayNext = (selectedTrack: LibraryTrack) => {
    setQueue((prevQueue) => {
      if (prevQueue.length === 0) return [selectedTrack];
      const currentPlayingIndex = 0;
      const nowPlaying = prevQueue[currentPlayingIndex];
      const remaining = prevQueue
        .slice(currentPlayingIndex + 1)
        .filter((track) => track.id !== selectedTrack.id);
      return [nowPlaying, selectedTrack, ...remaining];
    });
  };

  const isTrackFeatured = useCallback(
    (track: LibraryTrack) =>
      Boolean(track.isFeatured) ||
      featuredTracks.some((item) => item.id === track.id),
    [featuredTracks],
  );

  const handleAddToFeatured = async (track: LibraryTrack) => {
    if (!isAdmin) return;
    setFeaturingTrackId(track.id);
    try {
      const res = await fetch('/api/default-tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: track.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add to featured.');
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

      setLibrary((prev) =>
        prev.map((item) =>
          item.id === track.id
            ? { ...item, isFeatured: true, kind: item.kind }
            : item,
        ),
      );
      setFeaturedError(null);
    } catch (err) {
      setFeaturedError(
        err instanceof Error ? err.message : 'Failed to feature track.',
      );
    } finally {
      setFeaturingTrackId(null);
    }
  };

  const handleAddToPlaylist = (selectedTrack: LibraryTrack) => {
    openPlaylistModal(selectedTrack);
  };

  const openEditModal = (trackToEdit: LibraryTrack) => {
    setEditingTrack(trackToEdit);
    setEditForm({
      title: trackToEdit.title || '',
      artist: trackToEdit.artist || '',
      album: trackToEdit.album || '',
      genre: trackToEdit.genre || '',
    });
    setEditCoverFile(null);
    setEditCoverPreview(
      trackToEdit.imageURL ? getCoverSrc(trackToEdit.imageURL) : null,
    );
    setEditError(null);
    setEditModalOpen(true);
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditCoverChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setEditError('Cover must be an image file.');
      return;
    }
    const preview = await readFileAsDataURL(file);
    setEditCoverFile(file);
    setEditCoverPreview(preview);
    setEditError(null);
  };

  const clearEditCover = () => {
    setEditCoverFile(null);
    setEditCoverPreview(
      editingTrack?.imageURL ? getCoverSrc(editingTrack.imageURL) : null,
    );
  };

  const handleSaveEdit = async () => {
    if (!editingTrack) return;
    setEditLoading(true);
    setEditError(null);

    try {
      let imageURL = editingTrack.imageURL || null;
      let imageBlurhash = editingTrack.imageBlurhash || null;

      if (editCoverFile) {
        const result = await uploadCoverVariantsWithBlurhash(editCoverFile);
        imageURL = result.imageURL;
        imageBlurhash = result.imageBlurhash;
      }

      const payload = {
        ...editForm,
        title: editForm.title || editingTrack.title || '',
        artist: editForm.artist || editingTrack.artist || '',
        album: editForm.album || '',
        genre: editForm.genre || '',
        duration: editingTrack.duration,
        s3Key: editingTrack.s3Key,
        imageURL,
        imageBlurhash,
      };

      const res = await fetch(`/api/tracks/${editingTrack.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update track.');
      }

      const updatedIsFeatured = Boolean(
        (data.track || editingTrack)?.isFeatured || editingTrack?.isFeatured,
      );

      const updatedTrack: LibraryTrack = {
        ...(data.track || { ...editingTrack, ...payload }),
        isFeatured: updatedIsFeatured,
        kind: updatedIsFeatured ? 'featured' : 'user',
      };

      setLibrary((prev) =>
        prev.map((item) => (item.id === editingTrack.id ? updatedTrack : item)),
      );
      setQueue((prev) =>
        prev.map((item) => (item.id === editingTrack.id ? updatedTrack : item)),
      );
      fetchPlaylists();

      if (currentTrack?.id === updatedTrack.id) {
        setTrack(updatedTrack);
      }

      setEditModalOpen(false);
      setEditCoverFile(null);
      setEditCoverPreview(null);
      setEditingTrack(null);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : 'Failed to edit track.',
      );
    } finally {
      setEditLoading(false);
    }
  };

  const handleReorderTracks = async (orderedTracks: LibraryTrack[]) => {
    if (!activePlaylistFilter.id) return;
    const payload = orderedTracks.map((track) => ({
      id: track.id,
      kind: track.kind === 'featured' ? 'featured' : 'user',
    }));
    await reorderPlaylistTracks(activePlaylistFilter.id, payload);
  };

  const handlePlayPlaylist = (playlistId: string) => {
    const tracks = getPlaylistTracks(playlistId);
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!tracks.length || !playlist) return;
    setQueue(tracks);
    setCurrentTrackIndex(0);
    setTrack(tracks[0]);
    setCurrentTime(0);
    setIsPlaying(true);
    setViewMode('songs');
    setActivePlaylistFilter({ id: playlistId, name: playlist.name });
  };

  const handleSelectPlaylist = (playlistId: string) => {
    if (trackToAdd) {
      addTrackToPlaylist(playlistId, trackToAdd.id);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    const deleted = await deletePlaylist(playlistId);
    if (deleted && activePlaylistFilter.id === playlistId) {
      setActivePlaylistFilter(defaultPlaylistFilter);
      setViewMode('songs');
    }
  };

  const handleDeleteTrack = async (selectedTrack: LibraryTrack) => {
    if (isTrackFeatured(selectedTrack)) {
      // eslint-disable-next-line no-alert -- quick confirmation before destructive action
      const confirmed = window.confirm(
        'This track is featured and visible to everyone. Deleting it will also remove it from Featured. Delete anyway?',
      );
      if (!confirmed) return;
      try {
        await fetch(`/api/default-tracks/${selectedTrack.id}`, {
          method: 'DELETE',
        });
        setFeaturedTracks((prev) =>
          prev.filter((item) => item.id !== selectedTrack.id),
        );
      } catch (err) {
        setFeaturedError(
          err instanceof Error
            ? err.message
            : 'Failed to remove from featured.',
        );
        return;
      }
    }
    try {
      const res = await fetch(`/api/tracks/delete-url?id=${selectedTrack.id}`);
      const { deleteURL, coverDeleteURLs = [], error } = await res.json();

      if (!res.ok || error || !deleteURL) {
        throw new Error(error || 'Failed to prepare track deletion.');
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
        throw new Error(
          deleteTrackData.error || 'Failed to delete track record.',
        );
      }

      setLibrary((prevLibrary) =>
        prevLibrary.filter((item) => item.id !== selectedTrack.id),
      );
      removeTrackFromPlaylists(selectedTrack.id);
      setErrordisplay(null);

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
            const nextIndex = Math.min(removedIndex, filteredQueue.length - 1);
            setTrack(filteredQueue[nextIndex]);
            setCurrentTrackIndex(nextIndex);
            setCurrentTime(0);
            setIsPlaying(false);
          }
        } else if (removedIndex < currentTrackIndex) {
          setCurrentTrackIndex((prev) => Math.max(prev - 1, 0));
        }
      }
    } catch (deleteError) {
      setErrordisplay(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete the track. Please try again.',
      );
    }
  };

  const emptyMessage = activePlaylistFilter.id
    ? 'No tracks in this playlist yet.'
    : 'No songs yet. Upload your first track to get started.';

  if (status !== 'authenticated') {
    return (
      <div className="w-full pt-[4.5rem] sm:pt-10 px-4 sm:px-6 lg:px-8 pb-32 sm:pb-20 max-w-6xl mx-auto">
        {redirecting ? null : (
          <div className="text-sm text-muted">Loading your library...</div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full pt-[4.5rem] sm:pt-10 px-4 sm:px-6 lg:px-8 pb-32 sm:pb-20 max-w-6xl mx-auto scrollbar-soft">
      <LibraryHeader
        title={activePlaylistFilter.id ? activePlaylistFilter.name : 'Library'}
        hasActiveFilter={Boolean(activePlaylistFilter.id)}
        viewMode={viewMode}
        onViewChange={(mode) => {
          setViewMode(mode);
          if (mode === 'playlists') {
            setActivePlaylistFilter(defaultPlaylistFilter);
          }
        }}
        onClearFilter={() => {
          setActivePlaylistFilter(defaultPlaylistFilter);
          setViewMode('songs');
        }}
        onOpenUpload={() => {
          setUploadError('');
          openUploadModal();
        }}
      />

      {errorDisplay && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm shadow-soft">
          {errorDisplay}
        </div>
      )}
      {viewMode === 'songs' && !activePlaylistFilter.id && (
        <>
          {featuredError && (
            <div className="mb-4 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm shadow-soft">
              {featuredError}
            </div>
          )}
          {featuredTracks.length > 0 && (
            <section className="mb-8 rounded-2xl border border-borderLight dark:border-borderDark bg-panelLightAlt/70 dark:bg-panelDark/70 p-4 sm:p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    Featured
                  </p>
                  <h2 className="text-lg font-semibold">
                    Always-available tracks
                  </h2>
                  <p className="text-sm text-muted">
                    Curated tracks available to everyone.
                  </p>
                </div>
                <span className="text-xs text-muted">
                  {featuredTracks.length} tracks
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto sm:max-h-72 scrollbar-soft">
                <TrackListView
                  tracks={featuredTracks}
                  onSelect={handleFeaturedSelect}
                  onDelete={() => {}}
                  onAddToQueue={handleFeaturedAddToQueue}
                  onPlayNext={handleFeaturedPlayNext}
                  onAddToPlaylist={handleAddToPlaylist}
                />
              </div>
            </section>
          )}
        </>
      )}

      {(viewMode === 'songs' || activePlaylistFilter.id) &&
        (displayedTracks.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <section className="space-y-3">
            {viewMode === 'songs' && !activePlaylistFilter.id && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    Library
                  </p>
                  <h2 className="text-lg font-semibold">Your uploads</h2>
                </div>
                <span className="text-xs text-muted">
                  {displayedTracks.length} tracks
                </span>
              </div>
            )}
            <TrackListView
              tracks={displayedTracks}
              onSelect={handleTrackSelect}
              onDelete={handleDeleteTrack}
              onAddToQueue={handleAddTrackToQueue}
              onPlayNext={handlePlayNext}
              onAddToPlaylist={handleAddToPlaylist}
              reorderable={Boolean(activePlaylistFilter.id)}
              onReorder={handleReorderTracks}
              onEdit={openEditModal}
              onAddToFeatured={isAdmin ? handleAddToFeatured : undefined}
              featuringTrackId={featuringTrackId}
            />
          </section>
        ))}

      {viewMode === 'playlists' && (
        <PlaylistGrid
          playlists={playlists}
          onSelect={(playlistId) => {
            const selectedPlaylistName =
              playlists.find((p) => p.id === playlistId)?.name || 'Playlist';
            setActivePlaylistFilter({
              id: playlistId,
              name: selectedPlaylistName,
            });
            setViewMode('songs');
          }}
          onPlay={handlePlayPlaylist}
          onDelete={handleDeletePlaylist}
          onCreate={() => {
            setPlaylistError(null);
            setPlaylistName('');
            setCreatePlaylistOpen(true);
          }}
        />
      )}

      <PlaylistPickerModal
        isOpen={playlistModalOpen}
        playlists={playlists}
        trackTitle={trackToAdd?.title || trackToAdd?.s3Key}
        newPlaylistName={playlistName}
        loading={playlistLoading}
        error={playlistError}
        onClose={closePlaylistModal}
        onSelectPlaylist={handleSelectPlaylist}
        onCreatePlaylist={createPlaylist}
        onPlaylistNameChange={setPlaylistName}
      />

      <GlassModal
        isOpen={uploadModalOpen}
        onClose={() => {
          closeUploadModal();
        }}
        title="Add a track"
        eyebrow="Upload"
        size="lg"
      >
        {uploadError && (
          <p className="text-red-500 text-sm font-medium mt-1">{uploadError}</p>
        )}
        <div className="mt-4">
          <FileUploadForm
            selectedFile={selectedFile}
            metadata={trackInfo}
            coverFile={coverFile}
            coverPreview={coverPreview}
            uploading={uploading}
            onFileChange={handleFileChange}
            onInputChange={handleInputChange}
            onCoverChange={handleCoverChange}
            onClearCover={clearCover}
            onSubmit={handleUploadSubmit}
          />
        </div>
      </GlassModal>

      <GlassModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingTrack(null);
          setEditCoverFile(null);
          setEditCoverPreview(null);
          setEditError(null);
        }}
        title="Edit track"
        eyebrow="Update metadata"
        size="lg"
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                setEditModalOpen(false);
                setEditingTrack(null);
                setEditCoverFile(null);
                setEditCoverPreview(null);
                setEditError(null);
              }}
              className="px-4 py-2 rounded-full border border-white/70 dark:border-white/20 text-sm text-muted hover:bg-surfaceMuted/70 dark:hover:bg-backgroundDark/70"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={editLoading || !editingTrack}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-pastelPurple to-accentLight text-white text-sm font-semibold shadow-soft hover:shadow-glass disabled:opacity-60"
            >
              {editLoading ? 'Saving...' : 'Save changes'}
            </button>
          </>
        }
      >
        {editError && (
          <p className="text-red-500 text-sm font-medium mt-1">{editError}</p>
        )}
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-textLight dark:text-textDark">
                Cover art
              </p>
              {editCoverFile && (
                <button
                  type="button"
                  onClick={clearEditCover}
                  className="text-xs font-semibold text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
            <label
              htmlFor="edit-cover"
              className="group relative flex items-center gap-3 rounded-2xl border border-dashed border-borderLight dark:border-borderDark bg-panelLightAlt dark:bg-panelDark px-4 py-3 cursor-pointer hover:border-accentLight/70 hover:shadow-glass transition-all"
            >
              <input
                id="edit-cover"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleEditCoverChange}
                className="hidden"
              />
              <div className="h-16 w-16 rounded-xl overflow-hidden border border-borderLight dark:border-borderDark bg-surfaceMuted/40 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element -- local/remote preview */}
                <img
                  src={
                    editCoverPreview ||
                    (editingTrack?.imageURL
                      ? getCoverSrc(editingTrack.imageURL)
                      : '/default-thumbnail.png')
                  }
                  alt="Cover preview"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-ink dark:text-textDark">
                  {editCoverFile?.name || 'Change cover art'}
                </p>
                <p className="text-xs text-muted">
                  PNG/JPEG/WebP • we’ll resize to large + thumb
                </p>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              htmlFor="edit-title"
              className="space-y-1 text-sm font-medium text-textLight dark:text-textDark"
            >
              Title
              <input
                id="edit-title"
                name="title"
                value={editForm.title}
                onChange={handleEditInputChange}
                className="w-full rounded-xl border border-white/70 dark:border-white/10 bg-white/90 dark:bg-backgroundDark/80 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accentLight/30"
                placeholder="Track title"
              />
            </label>
            <label
              htmlFor="edit-artist"
              className="space-y-1 text-sm font-medium text-textLight dark:text-textDark"
            >
              Artist
              <input
                id="edit-artist"
                name="artist"
                value={editForm.artist}
                onChange={handleEditInputChange}
                className="w-full rounded-xl border border-white/70 dark:border-white/10 bg-white/90 dark:bg-backgroundDark/80 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accentLight/30"
                placeholder="Artist"
              />
            </label>
            <label
              htmlFor="edit-album"
              className="space-y-1 text-sm font-medium text-textLight dark:text-textDark"
            >
              Album
              <input
                id="edit-album"
                name="album"
                value={editForm.album}
                onChange={handleEditInputChange}
                className="w-full rounded-xl border border-white/70 dark:border-white/10 bg-white/90 dark:bg-backgroundDark/80 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accentLight/30"
                placeholder="Album"
              />
            </label>
            <label
              htmlFor="edit-genre"
              className="space-y-1 text-sm font-medium text-textLight dark:text-textDark"
            >
              Genre
              <input
                id="edit-genre"
                name="genre"
                value={editForm.genre}
                onChange={handleEditInputChange}
                className="w-full rounded-xl border border-white/70 dark:border-white/10 bg-white/90 dark:bg-backgroundDark/80 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accentLight/30"
                placeholder="Genre"
              />
            </label>
          </div>
        </div>
      </GlassModal>

      <GlassModal
        isOpen={createPlaylistOpen}
        onClose={() => {
          setCreatePlaylistOpen(false);
          setPlaylistError(null);
          setPlaylistName('');
        }}
        title="Create playlist"
        eyebrow="Playlist"
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                setCreatePlaylistOpen(false);
                setPlaylistError(null);
                setPlaylistName('');
              }}
              className="px-4 py-2 rounded-full border border-white/70 dark:border-white/20 text-sm text-muted hover:bg-surfaceMuted/70 dark:hover:bg-backgroundDark/70"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={createPlaylist}
              disabled={playlistLoading}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-pastelPurple to-accentLight text-white text-sm font-semibold shadow-soft hover:shadow-glass disabled:opacity-60"
            >
              {playlistLoading ? 'Saving...' : 'Create'}
            </button>
          </>
        }
      >
        {playlistError && (
          <p className="text-red-500 text-sm font-medium">{playlistError}</p>
        )}
        <label
          className="space-y-2 block text-sm font-medium text-textLight dark:text-textDark"
          htmlFor="new-playlist"
        >
          Playlist name
          <input
            id="new-playlist"
            type="text"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            className="w-full rounded-xl border border-white/70 dark:border-white/10 bg-white/90 dark:bg-backgroundDark/80 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accentLight/30"
            placeholder="Chill vibes"
          />
        </label>
      </GlassModal>
    </div>
  );
}
