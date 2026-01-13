'use client';

import React from 'react';
import { LibraryTrack } from '@app-types/libraryTrack';
import GlassModal from '@components/ui/GlassModal';

type FeaturedDeleteModalProps = {
  isOpen: boolean;
  track: LibraryTrack | null;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export default function FeaturedDeleteModal({
  isOpen,
  track,
  onCancel,
  onConfirm,
  loading = false,
}: FeaturedDeleteModalProps) {
  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onCancel}
      title="Delete featured track?"
      eyebrow="Featured"
      actions={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-full border border-white/70 dark:border-white/20 text-sm text-muted hover:bg-surfaceMuted/70 dark:hover:bg-backgroundDark/70"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-full bg-red-500 text-white text-sm font-semibold shadow-soft hover:bg-red-600 disabled:opacity-60"
          >
            {loading ? 'Deleting...' : 'Delete anyway'}
          </button>
        </>
      }
    >
      <p className="text-sm text-muted">
        This track is featured and visible to everyone. Deleting it will also
        remove it from Featured. Delete anyway?
      </p>
      {track?.title && (
        <p className="mt-3 text-sm font-semibold text-ink dark:text-textDark">
          {track.title}
        </p>
      )}
    </GlassModal>
  );
}
