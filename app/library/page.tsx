'use client';

import React, { useContext, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LibraryTrack } from '@app-types/libraryTrack';
import { PlayerContext } from '@/context/PlayerContext';
import LibraryHeader from '@components/library/LibraryHeader';
import PlaylistGrid from '@components/library/PlaylistGrid';
import TracksSection from '@components/library/TracksSection';
import FeaturedSection from '@components/library/FeaturedSection';
import UploadTrackModal from '@components/library/UploadTrackModal';
import EditTrackModal from '@components/library/EditTrackModal';
import CreatePlaylistModal from '@components/library/CreatePlaylistModal';
import AlertBanner from '@components/ui/AlertBanner';
import FeaturedDeleteModal from '@components/library/FeaturedDeleteModal';
import { usePlaylistManager } from '../hooks/usePlaylistManager';
import { useTrackUpload } from '../hooks/useTrackUpload';
import { useLibraryTracks } from '../hooks/useLibraryTracks';
import { useFeaturedTracks } from '../hooks/useFeaturedTracks';
import { useTrackEdit } from '../hooks/useTrackEdit';
import { useTrackDeletion } from '../hooks/useTrackDeletion';
import { useLibraryPlayback } from '../hooks/useLibraryPlayback';
import { useLibraryViewState } from '../hooks/useLibraryViewState';

const PlaylistPickerModal = dynamic(
  () => import('@components/playlist/PlaylistPickerModal'),
  {
    ssr: false,
    loading: () => (
      <div className="text-sm text-muted px-4 py-3">Loading playlists...</div>
    ),
  },
);

export default function Library(): JSX.Element {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const playerContext = useContext(PlayerContext);
  const isAdmin = status === 'authenticated' && session?.user?.role === 'ADMIN';
  const currentUserId = session?.user?.id ?? null;

  const {
    playlists,
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
    removeTrackFromPlaylist,
    fetchPlaylists,
  } = usePlaylistManager(status);
  const {
    viewMode,
    setViewMode,
    activePlaylistFilter,
    setActivePlaylistFilter,
    emptyMessage,
  } = useLibraryViewState({ defaultPlaylist: defaultPlaylistFilter });

  const libraryEnabled = status === 'authenticated';
  const infiniteScrollEnabled =
    libraryEnabled && viewMode === 'songs' && !activePlaylistFilter.id;

  const {
    library,
    setLibrary,
    error: errorDisplay,
    setError: setErrordisplay,
    initialLoading,
    loadingMore,
    hasMore,
    loadMoreRef,
    refreshLibrary,
  } = useLibraryTracks({
    enabled: libraryEnabled,
    infiniteScrollEnabled,
  });

  const {
    featuredTracks,
    featuredError,
    featuringTrackId,
    setFeaturedTracks,
    setFeaturedError,
    isTrackFeatured,
    addToFeatured,
  } = useFeaturedTracks({ enabled: libraryEnabled, isAdmin });

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
      refreshLibrary();
      setViewMode('songs');
    },
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      setRedirecting(true);
      router.replace('/login');
    }
  }, [status, router]);

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
    isShuffle,
    applyShuffleToQueue,
  } = playerContext;

  const {
    editModalOpen,
    editingTrack,
    editForm,
    editCoverFile,
    editCoverPreview,
    editLoading,
    editError,
    openEditModal,
    closeEditModal,
    handleEditInputChange,
    handleEditCoverChange,
    clearEditCover,
    handleSaveEdit,
    setEditError,
  } = useTrackEdit({
    onTrackUpdated: (updatedTrack) => {
      setLibrary((prev) =>
        prev.map((item) => (item.id === updatedTrack.id ? updatedTrack : item)),
      );
      setQueue((prev) =>
        prev.map((item) => (item.id === updatedTrack.id ? updatedTrack : item)),
      );
      if (currentTrack?.id === updatedTrack.id) {
        setTrack(updatedTrack);
      }
    },
    onAfterSave: fetchPlaylists,
  });

  const {
    handleDeleteTrack,
    featuredDeleteModalOpen,
    featuredDeleteTrack,
    confirmFeaturedDelete,
    cancelFeaturedDelete,
    deleteLoading,
  } = useTrackDeletion({
    isTrackFeatured,
    onFeaturedRemove: (id) =>
      setFeaturedTracks((prev) => prev.filter((item) => item.id !== id)),
    onFeaturedError: setFeaturedError,
    onLibraryUpdate: setLibrary,
    onRemoveFromPlaylists: removeTrackFromPlaylists,
    player: {
      queue,
      setQueue,
      currentTrack,
      setTrack,
      currentTrackIndex,
      setCurrentTrackIndex,
      setCurrentTime,
      setIsPlaying,
    },
    setError: setErrordisplay,
  });

  const {
    sourceTracks: displayedTracks,
    handleTrackSelect,
    handleAddTrackToQueue,
    handlePlayNext,
    handleFeaturedSelect,
    handleFeaturedAddToQueue,
    handleFeaturedPlayNext,
  } = useLibraryPlayback({
    library,
    featuredTracks,
    activePlaylistId: activePlaylistFilter.id,
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
  });

  const filteredTracks = displayedTracks.filter((track) => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    return (
      (track.title || '').toLowerCase().includes(query) ||
      (track.artist || '').toLowerCase().includes(query) ||
      (track.album || '').toLowerCase().includes(query) ||
      (track.genre || '').toLowerCase().includes(query)
    );
  });

  const handleAddToPlaylist = (selectedTrack: LibraryTrack) => {
    openPlaylistModal(selectedTrack);
  };

  const handleReorderTracks = async (orderedTracks: LibraryTrack[]) => {
    if (!activePlaylistFilter.id) return;
    const payload: Array<{ id: string; kind: 'user' | 'featured' }> =
      orderedTracks.map((track) => ({
        id: track.id,
        kind: track.kind === 'featured' ? 'featured' : 'user',
      }));
    await reorderPlaylistTracks(activePlaylistFilter.id, payload);
  };

  const handlePlayPlaylist = (playlistId: string) => {
    const tracks = getPlaylistTracks(playlistId);
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!tracks.length || !playlist) return;
    if (isShuffle) {
      applyShuffleToQueue(tracks, 0, { force: true });
    } else {
      setQueue(tracks);
      setCurrentTrackIndex(0);
    }
    setTrack(tracks[0]);
    setCurrentTime(0);
    setIsPlaying(true);
    setViewMode('songs');
    setActivePlaylistFilter({ id: playlistId, name: playlist.name });
  };

  const handleRemoveFromPlaylist = async (selectedTrack: LibraryTrack) => {
    if (!activePlaylistFilter.id) return;
    await removeTrackFromPlaylist(activePlaylistFilter.id, selectedTrack.id);
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
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {errorDisplay && (
        <AlertBanner
          message={errorDisplay}
          variant="error"
          className="mb-4"
          onDismiss={() => setErrordisplay(null)}
        />
      )}

      {viewMode === 'songs' && !activePlaylistFilter.id && (
        <FeaturedSection
          tracks={featuredTracks}
          error={featuredError}
          onDismissError={() => setFeaturedError(null)}
          onSelect={handleFeaturedSelect}
          onAddToQueue={handleFeaturedAddToQueue}
          onPlayNext={handleFeaturedPlayNext}
          onAddToPlaylist={handleAddToPlaylist}
          isAdmin={isAdmin}
        />
      )}

      <TracksSection
        viewMode={viewMode}
        activePlaylistFilter={activePlaylistFilter}
        displayedTracks={filteredTracks}
        initialLoading={initialLoading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        loadMoreRef={loadMoreRef}
        emptyMessage={emptyMessage}
        onSelect={handleTrackSelect}
        onDelete={handleDeleteTrack}
        onAddToQueue={handleAddTrackToQueue}
        onPlayNext={handlePlayNext}
        onAddToPlaylist={handleAddToPlaylist}
        onRemoveFromPlaylist={
          activePlaylistFilter.id ? handleRemoveFromPlaylist : undefined
        }
        reorderable={Boolean(activePlaylistFilter.id)}
        onReorder={handleReorderTracks}
        onEdit={openEditModal}
        onAddToFeatured={isAdmin ? addToFeatured : undefined}
        featuringTrackId={featuringTrackId}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
      />

      <FeaturedDeleteModal
        isOpen={featuredDeleteModalOpen}
        track={featuredDeleteTrack}
        onCancel={cancelFeaturedDelete}
        onConfirm={confirmFeaturedDelete}
        loading={deleteLoading}
      />

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
        onDismissError={() => setPlaylistError(null)}
        onClose={closePlaylistModal}
        onSelectPlaylist={handleSelectPlaylist}
        onCreatePlaylist={createPlaylist}
        onPlaylistNameChange={setPlaylistName}
      />

      <UploadTrackModal
        isOpen={uploadModalOpen}
        uploadError={uploadError}
        selectedFile={selectedFile}
        metadata={trackInfo}
        coverFile={coverFile}
        coverPreview={coverPreview}
        uploading={uploading}
        onDismissError={() => setUploadError('')}
        onClose={() => {
          closeUploadModal();
        }}
        onFileChange={handleFileChange}
        onInputChange={handleInputChange}
        onCoverChange={handleCoverChange}
        onClearCover={clearCover}
        onSubmit={handleUploadSubmit}
      />

      <EditTrackModal
        isOpen={editModalOpen}
        editingTrack={editingTrack}
        editForm={editForm}
        editCoverFile={editCoverFile}
        editCoverPreview={editCoverPreview}
        editError={editError}
        editLoading={editLoading}
        onDismissError={() => setEditError(null)}
        onClose={() => {
          closeEditModal();
          setEditError(null);
        }}
        onClearCover={clearEditCover}
        onSave={handleSaveEdit}
        onInputChange={handleEditInputChange}
        onCoverChange={handleEditCoverChange}
      />

      <CreatePlaylistModal
        isOpen={createPlaylistOpen}
        playlistName={playlistName}
        playlistLoading={playlistLoading}
        playlistError={playlistError}
        onDismissError={() => setPlaylistError(null)}
        onClose={() => {
          setCreatePlaylistOpen(false);
          setPlaylistError(null);
          setPlaylistName('');
        }}
        onCreate={createPlaylist}
        onNameChange={(value) => setPlaylistName(value)}
      />
    </div>
  );
}
