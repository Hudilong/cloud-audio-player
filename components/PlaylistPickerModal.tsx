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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-md bg-panelLight dark:bg-panelDark border border-borderLight dark:border-borderDark rounded-2xl shadow-glass p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 border-b border-borderLight/80 dark:border-borderDark/60 pb-3">
          <div className="space-y-1">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.14em] bg-panelLightAlt dark:bg-panelDarkAlt text-muted">
              Playlists
            </span>
            <h2 className="text-lg font-semibold text-ink dark:text-textDark">
              Add to playlist
            </h2>
            {trackTitle && (
              <p className="text-xs text-muted mt-1">
                Choose where to save &ldquo;{trackTitle}&rdquo;
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted hover:text-textLight dark:hover:text-textDark px-3 py-1 rounded-full hover:bg-surfaceMuted/80 dark:hover:bg-backgroundDark/70 transition-colors"
          >
            Close
          </button>
        </div>

        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {playlists.length === 0 ? (
            <p className="text-sm text-muted">
              No playlists yet. Create one below.
            </p>
          ) : (
            playlists.map((playlist) => (
              <button
                type="button"
                key={playlist.id}
                onClick={() => onSelectPlaylist(playlist.id)}
                disabled={loading}
                className="w-full text-left px-3 py-3 rounded-xl border border-borderLight dark:border-borderDark bg-panelLightAlt dark:bg-panelDark hover:border-accentLight/70 hover:shadow-glass transition-all disabled:opacity-60"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-ink dark:text-textDark">
                    {playlist.name}
                  </span>
                  <span className="text-xs text-muted">
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

        <div className="border-t border-white/70 dark:border-white/10 pt-3 space-y-2">
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
                className="w-full rounded-lg border border-white/60 dark:border-white/10 bg-white/90 dark:bg-backgroundDark/80 px-3 py-2 text-sm focus:outline-none focus:border-accentLight focus:ring-2 focus:ring-accentLight/30"
              />
            </label>
            <button
              type="button"
              onClick={onCreatePlaylist}
              disabled={loading}
              className="px-4 py-2 text-sm bg-gradient-to-r from-pastelPurple to-accentLight text-white rounded-lg shadow-soft hover:shadow-glass disabled:opacity-60 self-end transition-all"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
