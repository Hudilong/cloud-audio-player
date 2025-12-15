'use client';

import React from 'react';
import { LibraryTrack } from '@app-types/libraryTrack';
import GlassModal from '@components/ui/GlassModal';
import { getCoverSrc } from '@utils/getCoverSrc';

type EditTrackModalProps = {
  isOpen: boolean;
  editingTrack: LibraryTrack | null;
  editForm: {
    title: string;
    artist: string;
    album: string;
    genre: string;
  };
  editCoverFile: File | null;
  editCoverPreview: string | null;
  editError: string | null;
  editLoading: boolean;
  onClose: () => void;
  onClearCover: () => void;
  onSave: () => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onCoverChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function EditTrackModal({
  isOpen,
  editingTrack,
  editForm,
  editCoverFile,
  editCoverPreview,
  editError,
  editLoading,
  onClose,
  onClearCover,
  onSave,
  onInputChange,
  onCoverChange,
}: EditTrackModalProps) {
  const coverSrc =
    editCoverPreview ||
    (editingTrack?.imageURL
      ? getCoverSrc(editingTrack.imageURL)
      : '/default-thumbnail.png');

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit track"
      eyebrow="Update metadata"
      size="lg"
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
            onClick={onSave}
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
                onClick={onClearCover}
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
              onChange={onCoverChange}
              className="hidden"
            />
            <div className="h-16 w-16 rounded-xl overflow-hidden border border-borderLight dark:border-borderDark bg-surfaceMuted/40 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element -- local/remote preview */}
              <img
                src={coverSrc}
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
              onChange={onInputChange}
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
              onChange={onInputChange}
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
              onChange={onInputChange}
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
              onChange={onInputChange}
              className="w-full rounded-xl border border-white/70 dark:border-white/10 bg-white/90 dark:bg-backgroundDark/80 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accentLight/30"
              placeholder="Genre"
            />
          </label>
        </div>
      </div>
    </GlassModal>
  );
}
