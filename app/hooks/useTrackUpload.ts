'use client';

import { useCallback, useState } from 'react';
import { uploadCoverVariantsWithBlurhash } from '@services/storage/coverService';
import { parseBlob } from 'music-metadata-browser';
import { TrackInfo } from '../../types';
import { readFileAsDataURL } from '../../utils/imageProcessing';

interface UseTrackUploadOptions {
  onSuccess?: () => void;
}

const emptyTrackInfo: TrackInfo = {
  title: '',
  artist: '',
  album: '',
  duration: 0,
  genre: '',
  imageURL: null,
  imageBlurhash: null,
};

export function useTrackUpload(options: UseTrackUploadOptions = {}) {
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
    };

    const coverPicture = metadataResult.common.picture?.[0];
    if (coverPicture) {
      const mime = coverPicture.format || 'image/jpeg';
      const embeddedFile = new File([coverPicture.data], 'embedded-cover', {
        type: mime,
      });
      const preview = await readFileAsDataURL(embeddedFile);
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
        setUploadError('Failed to extract metadata.');
      }
    },
    [],
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
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          let imageURL: string | null = null;
          let imageBlurhash: string | null = null;

          if (coverFile) {
            const result = await uploadCoverVariantsWithBlurhash(coverFile);
            imageURL = result.imageURL;
            imageBlurhash = result.imageBlurhash;
          }

          const base64Buffer = reader.result?.toString().split(',')[1];
          if (!base64Buffer) throw new Error('Unable to read file');

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
              imageURL,
              imageBlurhash,
            }),
            headers: { 'Content-Type': 'application/json' },
          });
          if (!saveResponse.ok) throw new Error('Failed to save metadata');

          closeUploadModal();
          options.onSuccess?.();
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

      reader.onerror = () => {
        setUploadError('Failed to read file');
        setUploading(false);
      };

      reader.readAsDataURL(selectedFile);
    },
    [closeUploadModal, coverFile, options, selectedFile, trackInfo],
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
