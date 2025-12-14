'use client';

import React, { useCallback, useState } from 'react';
import { LibraryTrack } from '@app-types/libraryTrack';
import { getCoverSrc } from '@utils/getCoverSrc';
import { readFileAsDataURL } from '@utils/imageProcessing';
import { getFriendlyMessage } from '@utils/apiError';
import { uploadCoverVariantsWithBlurhash } from '@services/storage/coverService';
import { updateTrack } from '../../services/tracksClient';

type UseTrackEditOptions = {
  onTrackUpdated: (track: LibraryTrack) => void;
  onAfterSave?: () => void;
};

const emptyForm = {
  title: '',
  artist: '',
  album: '',
  genre: '',
};

export function useTrackEdit({
  onTrackUpdated,
  onAfterSave,
}: UseTrackEditOptions) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<LibraryTrack | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const openEditModal = useCallback((trackToEdit: LibraryTrack) => {
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
  }, []);

  const closeEditModal = useCallback(() => {
    setEditModalOpen(false);
    setEditingTrack(null);
    setEditCoverFile(null);
    setEditCoverPreview(null);
    setEditError(null);
    setEditForm(emptyForm);
  }, []);

  const handleEditInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    },
    [],
  );

  const handleEditCoverChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    },
    [],
  );

  const clearEditCover = useCallback(() => {
    setEditCoverFile(null);
    setEditCoverPreview(
      editingTrack?.imageURL ? getCoverSrc(editingTrack.imageURL) : null,
    );
  }, [editingTrack]);

  const handleSaveEdit = useCallback(async () => {
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

      const updated = await updateTrack(editingTrack.id, payload);

      onTrackUpdated(updated);
      onAfterSave?.();

      closeEditModal();
    } catch (err) {
      setEditError(getFriendlyMessage(err as Error));
    } finally {
      setEditLoading(false);
    }
  }, [
    closeEditModal,
    editCoverFile,
    editForm,
    editingTrack,
    onAfterSave,
    onTrackUpdated,
  ]);

  return {
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
  };
}
