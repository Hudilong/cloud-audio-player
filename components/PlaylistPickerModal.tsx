'use client';

import React from 'react';
import { PlaylistWithTracks } from '../types/playlist';

interface PlaylistPickerModalProps {
  isOpen: boolean;
  playlists: PlaylistWithTracks[];
  trackTitle?: string | null;
  newPlaylistName: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSelectPlaylist: (playlistId: string) => void;
  onCreatePlaylist: () => void;
  onPlaylistNameChange: (value: string) => void;
}

export default function PlaylistPickerModal({
  isOpen,
  playlists,
  trackTitle,
  newPlaylistName,
  loading,
  error,
  onClose,
  onSelectPlaylist,
  onCreatePlaylist,
  onPlaylistNameChange,
}: PlaylistPickerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-soft p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Add to playlist
            </h2>
            {trackTitle && (
              <p className="text-xs text-gray-500 mt-1">
                Choose where to save &ldquo;{trackTitle}&rdquo;
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Close
          </button>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {playlists.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No playlists yet. Create one below.
            </p>
          ) : (
            playlists.map((playlist) => (
              <button
                type="button"
                key={playlist.id}
                onClick={() => onSelectPlaylist(playlist.id)}
                disabled={loading}
                className="w-full text-left px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{playlist.name}</span>
                  <span className="text-xs text-gray-500">
                    {playlist.playlistTracks?.length ?? 0}{' '}
                    {(playlist.playlistTracks?.length ?? 0) === 1
                      ? 'track'
                      : 'tracks'}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
          <div className="flex gap-2">
            <label
              className="flex-1 text-sm font-medium"
              htmlFor="new-playlist-name"
            >
              <span className="block mb-2">Create new playlist</span>
              <input
                id="new-playlist-name"
                type="text"
                value={newPlaylistName}
                onChange={(e) => onPlaylistNameChange(e.target.value)}
                placeholder="Playlist name"
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={onCreatePlaylist}
              disabled={loading}
              className="px-3 py-2 text-sm bg-accentLight dark:bg-accentDark text-white rounded-md shadow-soft disabled:opacity-60 self-end"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
