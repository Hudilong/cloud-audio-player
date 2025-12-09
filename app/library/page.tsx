'use client';

import React, { useEffect, useContext, useState } from 'react';
import { Track } from '@prisma/client';
import { PlayerContext } from '@/context/PlayerContext';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FiPlus } from 'react-icons/fi';
import { parseBlob } from 'music-metadata-browser';
import Image from 'next/image';
import TrackListView from '../../components/TrackListView';
import PlaylistPickerModal from '../../components/PlaylistPickerModal';
import FileUploadForm from '../../components/FileUploadForm';
import { TrackInfo } from '../../types';
import { PlaylistWithTracks } from '../../types/playlist';

export default function Library(): JSX.Element {
  const { status } = useSession();
  const router = useRouter();
  const playerContext = useContext(PlayerContext);
  const [library, setLibrary] = useState<Track[]>([]);
  const [errorDisplay, setErrordisplay] = useState<string | null>(null); // Error state
  const [playlists, setPlaylists] = useState<PlaylistWithTracks[]>([]);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistError, setPlaylistError] = useState<string | null>(null);
  const [playlistName, setPlaylistName] = useState('');
  const [trackToAdd, setTrackToAdd] = useState<Track | null>(null);
  const [viewMode, setViewMode] = useState<'songs' | 'playlists'>('songs');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [trackInfo, setTrackInfo] = useState<TrackInfo>({
    title: '',
    artist: '',
    album: '',
    duration: 0,
    genre: '',
    imageURL: '',
  });
  const [activePlaylistFilter, setActivePlaylistFilter] = useState<{
    id: string | null;
    name: string;
  }>({ id: null, name: 'Library' });

  const getPlaylistTracks = (playlistId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return [];
    return [...playlist.playlistTracks]
      .sort((a, b) => a.position - b.position)
      .map((item) => item.track);
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchPlaylists() {
      try {
        const res = await fetch('/api/playlists');
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to load playlists.');

        setPlaylists(data.playlists || []);
        setPlaylistError(null);
      } catch (error) {
        setPlaylistError(
          error instanceof Error ? error.message : 'Failed to load playlists.',
        );
      }
    }

    if (status === 'authenticated') {
      fetchPlaylists();
    }
  }, [status]);

  if (!playerContext) {
    throw new Error('Library must be used within a PlayerProvider');
  }

  const {
    setTrack,
    setCurrentTime,
    setIsPlaying,
    setCurrentTrackIndex,
    setQueue,
  } = playerContext;

  const fetchTracks = async () => {
    try {
      const res = await fetch('/api/tracks');

      if (!res.ok) {
        throw new Error('Failed to fetch tracks. Please try again later.');
      }

      const data = await res.json();
      setLibrary(data.tracks);
      setErrordisplay(null); // Clear any previous errors
    } catch (error) {
      setErrordisplay(
        error instanceof Error ? error.message : 'Something went wrong.',
      );
    }
  };

  // Fetch user tracks
  useEffect(() => {
    fetchTracks();
  }, []);

  const openPlaylistModal = (selectedTrack: Track) => {
    setTrackToAdd(selectedTrack);
    setPlaylistModalOpen(true);
    setPlaylistError(null);
  };

  const addTrackToPlaylist = async (playlistId: string, trackId: string) => {
    setPlaylistLoading(true);
    try {
      const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to add to playlist.');

      if (data.playlist) {
        setPlaylists((prev) => {
          const exists = prev.some(
            (playlist) => playlist.id === data.playlist.id,
          );
          if (exists) {
            return prev.map((playlist) =>
              playlist.id === data.playlist.id ? data.playlist : playlist,
            );
          }
          return [data.playlist, ...prev];
        });
      }

      setPlaylistModalOpen(false);
      setPlaylistName('');
      setTrackToAdd(null);
      setPlaylistError(null);
    } catch (error) {
      setPlaylistError(
        error instanceof Error ? error.message : 'Failed to add to playlist.',
      );
    } finally {
      setPlaylistLoading(false);
    }
  };

  const handleSelectPlaylist = (playlistId: string) => {
    if (trackToAdd) {
      addTrackToPlaylist(playlistId, trackToAdd.id);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      setPlaylistError('Please enter a playlist name.');
      return;
    }

    setPlaylistLoading(true);
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playlistName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to create playlist.');

      const newPlaylist: PlaylistWithTracks = {
        ...data.playlist,
        playlistTracks: [],
      };

      setPlaylists((prev) => [newPlaylist, ...prev]);
      setPlaylistError(null);
      setPlaylistName('');
      setCreatePlaylistOpen(false);

      if (trackToAdd) {
        await addTrackToPlaylist(newPlaylist.id, trackToAdd.id);
      } else {
        setPlaylistModalOpen(false);
      }
    } catch (error) {
      setPlaylistError(
        error instanceof Error ? error.message : 'Failed to create playlist.',
      );
    } finally {
      setPlaylistLoading(false);
    }
  };

  const closePlaylistModal = () => {
    setPlaylistModalOpen(false);
    setPlaylistName('');
    setPlaylistError(null);
    setTrackToAdd(null);
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete playlist.');

      setPlaylists((prev) =>
        prev.filter((playlist) => playlist.id !== playlistId),
      );

      if (activePlaylistFilter.id === playlistId) {
        setActivePlaylistFilter({ id: null, name: 'Library' });
        setViewMode('songs');
      }
    } catch (error) {
      setPlaylistError(
        error instanceof Error ? error.message : 'Failed to delete playlist.',
      );
    }
  };

  const handleTrackSelect = (selectedTrack: Track) => {
    const sourceTracks = activePlaylistFilter.id
      ? getPlaylistTracks(activePlaylistFilter.id)
      : library;
    setQueue(sourceTracks);
    const index = sourceTracks.findIndex(
      (track) => track.id === selectedTrack.id,
    );
    setCurrentTrackIndex(index);
    setTrack(selectedTrack);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleAddTrackToQueue = (selectedTrack: Track) => {
    setQueue((prevQueue) => [...prevQueue, selectedTrack]);
  };

  const handlePlayNext = (selectedTrack: Track) => {
    setQueue((prevQueue) => {
      // Find the currently playing track index (assumed to be the first in the queue)
      const currentPlayingIndex = 0;

      // Create a new queue with everything before the currently playing track and the selected track as the next
      const newQueue = [
        prevQueue[currentPlayingIndex], // Keep the currently playing track
        selectedTrack, // Insert the selected track to play next
        ...prevQueue.slice(currentPlayingIndex + 1), // Keep the rest of the queue
      ].filter((track, index) => track.id !== selectedTrack.id || index === 1);

      return newQueue;
    });
  };

  const handleAddToPlaylist = (selectedTrack: Track) => {
    openPlaylistModal(selectedTrack);
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

  const extractMetadata = async (file: File): Promise<TrackInfo> => {
    const metadataResult = await parseBlob(file);
    const durationInSeconds = metadataResult.format.duration || 0;
    return {
      title: metadataResult.common.title || '',
      artist: metadataResult.common.artist || '',
      album: metadataResult.common.album || '',
      imageURL: null,
      genre: metadataResult.common.genre?.[0] || '',
      duration: Math.floor(durationInSeconds),
    };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      try {
        const metadata = await extractMetadata(file);
        setTrackInfo(metadata);
        setUploadError('');
      } catch {
        setUploadError('Failed to extract metadata.');
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setTrackInfo({ ...trackInfo, [e.target.name]: e.target.value });
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setTrackInfo({
      title: '',
      artist: '',
      album: '',
      imageURL: '',
      duration: 0,
      genre: '',
    });
    setUploadError('');
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('No file selected');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Buffer = reader.result?.toString().split(',')[1];

          const response = await fetch('/api/tracks/upload-url', {
            method: 'POST',
            body: JSON.stringify({
              name: selectedFile.name,
              type: selectedFile.type,
              fileBuffer: base64Buffer,
            }),
            headers: { 'Content-Type': 'application/json' },
          });

          const { uploadURL, key, error } = await response.json();
          if (error) throw new Error(error);

          const uploadResponse = await fetch(uploadURL, {
            method: 'PUT',
            body: selectedFile,
            headers: { 'Content-Type': selectedFile.type },
          });
          if (!uploadResponse.ok) throw new Error('Failed to upload file');

          const saveResponse = await fetch('/api/tracks', {
            method: 'POST',
            body: JSON.stringify({
              ...trackInfo,
              s3Key: key,
            }),
            headers: { 'Content-Type': 'application/json' },
          });
          if (!saveResponse.ok) throw new Error('Failed to save metadata');

          resetUploadForm();
          setUploadModalOpen(false);
          fetchTracks();
          setViewMode('songs');
        } catch (err) {
          if (err instanceof Error) {
            setUploadError(err.message);
          } else {
            setUploadError('An unexpected error occurred');
          }
        } finally {
          setUploading(false);
        }
      };

      reader.readAsDataURL(selectedFile);
    } catch (err) {
      if (err instanceof Error) {
        setUploadError(err.message);
      } else {
        setUploadError('An unexpected error occurred');
      }
      setUploading(false);
    }
  };

  const handleDeleteTrack = async (selectedTrack: Track) => {
    try {
      const res = await fetch(`/api/tracks/delete-url?id=${selectedTrack.id}`);
      const { deleteURL, error } = await res.json();

      if (error) throw new Error(error);

      const deleteResponse = await fetch(deleteURL, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) throw new Error('Failed to delete file');

      await fetch(`/api/tracks/${selectedTrack.id}`, {
        method: 'DELETE',
      });

      setLibrary((prevLibrary) =>
        prevLibrary.filter((item) => item.id !== selectedTrack.id),
      );
      setPlaylists((prev) =>
        prev.map((playlist) => ({
          ...playlist,
          playlistTracks: playlist.playlistTracks.filter(
            (pt) => pt.track.id !== selectedTrack.id,
          ),
        })),
      );
    } catch {
      setErrordisplay('Failed to delete the track. Please try again.');
    }
  };

  const displayedTracks = activePlaylistFilter.id
    ? getPlaylistTracks(activePlaylistFilter.id)
    : library;

  return (
    <div className="w-full pt-[4.5rem] sm:pt-10 px-4 sm:px-6 lg:px-8 pb-12 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Library
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold">
                {activePlaylistFilter.id
                  ? activePlaylistFilter.name
                  : 'Library'}
              </h1>
              {activePlaylistFilter.id && (
                <button
                  type="button"
                  onClick={() =>
                    setActivePlaylistFilter({ id: null, name: 'Library' })
                  }
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border border-white/60 dark:border-white/10 text-muted hover:text-textLight hover:border-accentLight/70"
                >
                  Clear
                </button>
              )}
            </div>
            {!activePlaylistFilter.id && (
              <div className="inline-flex items-center gap-2 p-1 rounded-full border border-white/60 dark:border-white/10 bg-white/70 dark:bg-backgroundDark/70 shadow-soft">
                <button
                  type="button"
                  onClick={() => setViewMode('songs')}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                    viewMode === 'songs'
                      ? 'bg-gradient-to-r from-pastelPurple to-accentLight text-white shadow-soft'
                      : 'text-muted'
                  }`}
                >
                  Songs
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('playlists');
                    setActivePlaylistFilter({ id: null, name: 'Library' });
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                    viewMode === 'playlists'
                      ? 'bg-gradient-to-r from-pastelPurple to-accentLight text-white shadow-soft'
                      : 'text-muted'
                  }`}
                >
                  Playlists
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setUploadModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-pastelPurple to-accentLight text-white font-semibold shadow-soft hover:shadow-glass"
        >
          <FiPlus />
          Upload
        </button>
      </div>

      {errorDisplay && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm shadow-soft">
          {errorDisplay}
        </div>
      )}

      {(viewMode === 'songs' || activePlaylistFilter.id) &&
        (displayedTracks.length === 0 ? (
          <div className="rounded-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-backgroundDark/70 backdrop-blur p-6 text-center text-muted">
            {activePlaylistFilter.id
              ? 'No tracks in this playlist yet.'
              : 'No songs yet. Upload your first track to get started.'}
          </div>
        ) : (
          <TrackListView
            tracks={displayedTracks}
            onSelect={handleTrackSelect}
            onDelete={handleDeleteTrack}
            onAddToQueue={handleAddTrackToQueue}
            onPlayNext={handlePlayNext}
            onAddToPlaylist={handleAddToPlaylist}
          />
        ))}

      {viewMode === 'playlists' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {playlists.length === 0 && (
            <button
              type="button"
              onClick={() => setCreatePlaylistOpen(true)}
              className="h-full min-h-[180px] rounded-2xl border border-dashed border-white/60 dark:border-white/15 bg-white/60 dark:bg-backgroundDark/70 backdrop-blur flex flex-col items-center justify-center gap-3 text-muted hover:border-accentLight/70 hover:text-textLight hover:shadow-glass transition"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pastelPurple to-accentLight text-white shadow-soft">
                <FiPlus />
              </span>
              <p className="font-semibold">Create playlist</p>
            </button>
          )}
          {playlists.map((playlist) => {
            const orderedTracks = [...playlist.playlistTracks].sort(
              (a, b) => a.position - b.position,
            );
            const coverImage =
              orderedTracks[0]?.track.imageURL || '/default-thumbnail.png';
            const trackCount = orderedTracks.length;

            return (
              <div
                key={playlist.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setActivePlaylistFilter({
                    id: playlist.id,
                    name: playlist.name,
                  });
                  setViewMode('songs');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActivePlaylistFilter({
                      id: playlist.id,
                      name: playlist.name,
                    });
                    setViewMode('songs');
                  }
                }}
                className="rounded-2xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-backgroundDark/80 backdrop-blur p-4 shadow-soft hover:shadow-glass flex flex-col gap-3 cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-xl border border-white/70 dark:border-white/10 h-32 bg-surfaceMuted">
                  <Image
                    src={coverImage}
                    alt={`${playlist.name} cover`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 text-xs font-semibold px-3 py-1 rounded-full bg-white/80 dark:bg-backgroundDark/80 text-ink dark:text-textDark">
                    {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-ink dark:text-textDark">
                      {playlist.name}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayPlaylist(playlist.id);
                      }}
                      disabled={trackCount === 0}
                      className="px-3 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-pastelPurple to-accentLight text-white shadow-soft disabled:opacity-60"
                    >
                      Play
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlaylist(playlist.id);
                      }}
                      className="px-3 py-2 rounded-full text-xs font-semibold border border-red-400/70 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {playlists.length > 0 && (
            <button
              type="button"
              onClick={() => setCreatePlaylistOpen(true)}
              className="h-full min-h-[180px] rounded-2xl border border-dashed border-white/60 dark:border-white/15 bg-white/60 dark:bg-backgroundDark/70 backdrop-blur flex flex-col items-center justify-center gap-3 text-muted hover:border-accentLight/70 hover:text-textLight hover:shadow-glass transition"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pastelPurple to-accentLight text-white shadow-soft">
                <FiPlus />
              </span>
              <p className="font-semibold">Create playlist</p>
            </button>
          )}
        </div>
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
        onCreatePlaylist={handleCreatePlaylist}
        onPlaylistNameChange={setPlaylistName}
      />

      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[180] flex items-center justify-center px-4">
          <div className="relative w-full max-w-xl bg-white/95 dark:bg-backgroundDark/95 rounded-2xl border border-white/60 dark:border-white/10 shadow-glass p-6 sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.14em] text-muted font-semibold">
                  Upload
                </p>
                <h2 className="text-xl font-semibold">Add a track</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUploadModalOpen(false);
                  resetUploadForm();
                }}
                className="px-3 py-1 rounded-full text-sm text-muted hover:text-textLight hover:bg-surfaceMuted/70"
              >
                Close
              </button>
            </div>
            {uploadError && (
              <p className="text-red-500 text-sm font-medium mt-2">
                {uploadError}
              </p>
            )}
            <div className="mt-4">
              <FileUploadForm
                selectedFile={selectedFile}
                metadata={trackInfo}
                uploading={uploading}
                onFileChange={handleFileChange}
                onInputChange={handleInputChange}
                onSubmit={handleUploadSubmit}
              />
            </div>
          </div>
        </div>
      )}

      {createPlaylistOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[180] flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white/95 dark:bg-backgroundDark/95 rounded-2xl border border-white/60 dark:border-white/10 shadow-glass p-6 sm:p-7 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted font-semibold">
                  Playlist
                </p>
                <h2 className="text-xl font-semibold text-ink dark:text-textDark">
                  Create playlist
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCreatePlaylistOpen(false);
                  setPlaylistError(null);
                  setPlaylistName('');
                }}
                className="px-3 py-1 rounded-full text-sm text-muted hover:text-textLight hover:bg-surfaceMuted/70"
              >
                Close
              </button>
            </div>
            {playlistError && (
              <p className="text-red-500 text-sm font-medium">
                {playlistError}
              </p>
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
            <div className="flex justify-end gap-2">
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
                onClick={handleCreatePlaylist}
                disabled={playlistLoading}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-pastelPurple to-accentLight text-white text-sm font-semibold shadow-soft hover:shadow-glass disabled:opacity-60"
              >
                {playlistLoading ? 'Saving...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
