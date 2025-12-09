'use client';

import { useCallback, useState } from 'react';
import { parseBlob } from 'music-metadata-browser';
import { TrackInfo } from '../../types';

interface UseTrackUploadOptions {
  onSuccess?: () => void;
}

const emptyTrackInfo: TrackInfo = {
  title: '',
  artist: '',
  album: '',
  duration: 0,
  genre: '',
  imageURL: '',
};

export function useTrackUpload(options: UseTrackUploadOptions = {}) {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [trackInfo, setTrackInfo] = useState<TrackInfo>(emptyTrackInfo);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const resetUploadForm = useCallback(() => {
    setSelectedFile(null);
    setTrackInfo(emptyTrackInfo);
    setUploadError('');
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
    return {
      title: metadataResult.common.title || '',
      artist: metadataResult.common.artist || '',
      album: metadataResult.common.album || '',
      imageURL: null,
      genre: metadataResult.common.genre?.[0] || '',
      duration: Math.floor(durationInSeconds),
    };
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
    [closeUploadModal, options, selectedFile, trackInfo],
  );

  return {
    uploadModalOpen,
    selectedFile,
    trackInfo,
    uploading,
    uploadError,
    openUploadModal,
    closeUploadModal,
    handleFileChange,
    handleInputChange,
    handleUploadSubmit,
    resetUploadForm,
    setUploadError,
  };
}
