'use client';

import { useCallback, useState } from 'react';
import { parseBlob } from 'music-metadata-browser';
import { TrackInfo } from '../../types';
import { readFileAsDataURL } from '../../utils/imageProcessing';
import { getFriendlyMessage } from '../../utils/apiError';
import { useToast } from '../context/ToastContext';
import {
  extractEmbeddedCover,
  requestUploadUrl,
  saveTrack,
  uploadCoverAndGetMeta,
  uploadFileToUrl,
} from '../../services/trackUpload';

interface UseTrackUploadOptions {
  onSuccess?: () => void;
  saveEndpoint?: string;
}

const emptyTrackInfo: TrackInfo = {
  title: '',
  artist: '',
  album: '',
  duration: 0,
  genre: '',
  imageURL: null,
  imageBlurhash: null,
  isFeatured: false,
};

export function useTrackUpload(options: UseTrackUploadOptions = {}) {
  const { onSuccess, saveEndpoint = '/api/tracks' } = options;
  const { notify } = useToast();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [trackInfo, setTrackInfo] = useState<TrackInfo>(emptyTrackInfo);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const resetUploadForm = useCallback(() => {
    setSelectedFile(null);
    setTrackInfo(emptyTrackInfo);
    setUploadError('');
    setCoverFile(null);
    setCoverPreview(null);
  }, []);

  const openUploadModal = useCallback(() => {
    setUploadModalOpen(true);
    setUploadError('');
  }, []);

  const closeUploadModal = useCallback(() => {
    setUploadModalOpen(false);
    resetUploadForm();
  }, [resetUploadForm]);

  const extractMetadata = async (file: File): Promise<TrackInfo> => {
    const metadataResult = await parseBlob(file);
    const durationInSeconds = metadataResult.format.duration || 0;
    const info: TrackInfo = {
      title: metadataResult.common.title || '',
      artist: metadataResult.common.artist || '',
      album: metadataResult.common.album || '',
      imageURL: null,
      imageBlurhash: null,
      genre: metadataResult.common.genre?.[0] || '',
      duration: Math.floor(durationInSeconds),
      isFeatured: false,
    };

    const { embeddedFile, preview } =
      await extractEmbeddedCover(metadataResult);
    if (embeddedFile && preview) {
      setCoverFile(embeddedFile);
      setCoverPreview(preview);
    }
    return info;
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setSelectedFile(file);
      try {
        const metadata = await extractMetadata(file);
        setTrackInfo(metadata);
        setUploadError('');
      } catch {
        const message = 'Failed to extract metadata.';
        setUploadError(message);
        notify(message, { variant: 'error' });
      }
    },
    [notify],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setTrackInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    },
    [],
  );

  const handleCoverChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        setUploadError('Cover must be an image file.');
        return;
      }
      const preview = await readFileAsDataURL(file);
      setCoverFile(file);
      setCoverPreview(preview);
      setUploadError('');
    },
    [],
  );

  const clearCover = useCallback(() => {
    setCoverFile(null);
    setCoverPreview(null);
  }, []);

  const handleUploadSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedFile) {
        setUploadError('No file selected');
        return;
      }

      setUploading(true);
      (async () => {
        try {
          const coverMeta = await uploadCoverAndGetMeta(coverFile);
          const { uploadURL, key } = await requestUploadUrl(selectedFile);
          await uploadFileToUrl(uploadURL, selectedFile);
          await saveTrack(
            {
              ...trackInfo,
              s3Key: key,
              imageURL: coverMeta.imageURL,
              imageBlurhash: coverMeta.imageBlurhash,
            },
            saveEndpoint,
          );

          closeUploadModal();
          onSuccess?.();
        } catch (err) {
          const message =
            err instanceof Error
              ? getFriendlyMessage(err)
              : 'An unexpected error occurred';
          setUploadError(message);
          notify(message, { variant: 'error' });
        } finally {
          setUploading(false);
        }
      })();
    },
    [
      closeUploadModal,
      coverFile,
      onSuccess,
      saveEndpoint,
      selectedFile,
      trackInfo,
      notify,
    ],
  );

  return {
    uploadModalOpen,
    selectedFile,
    trackInfo,
    uploading,
    uploadError,
    coverFile,
    coverPreview,
    openUploadModal,
    closeUploadModal,
    handleFileChange,
    handleInputChange,
    handleCoverChange,
    clearCover,
    handleUploadSubmit,
    resetUploadForm,
    setUploadError,
  };
}
