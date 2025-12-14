'use client';

import React from 'react';
import GlassModal from '@components/ui/GlassModal';

type CreatePlaylistModalProps = {
  isOpen: boolean;
  playlistName: string;
  playlistLoading: boolean;
  playlistError: string | null;
  onClose: () => void;
  onCreate: () => void;
  onNameChange: (value: string) => void;
};

export default function CreatePlaylistModal({
  isOpen,
  playlistName,
  playlistLoading,
  playlistError,
  onClose,
  onCreate,
  onNameChange,
}: CreatePlaylistModalProps) {
  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create playlist"
      eyebrow="Playlist"
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-white/70 dark:border-white/20 text-sm text-muted hover:bg-surfaceMuted/70 dark:hover:bg-backgroundDark/70"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onCreate}
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
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full rounded-xl border border-white/70 dark:border-white/10 bg-white/90 dark:bg-backgroundDark/80 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accentLight/30"
          placeholder="Chill vibes"
        />
      </label>
    </GlassModal>
  );
}
