'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import GlassModal from '@components/ui/GlassModal';
import { TrackInfo } from '@app-types/trackInfo';

const FileUploadForm = dynamic(
  () => import('@components/forms/FileUploadForm'),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3 text-sm text-muted px-2 py-3">
        <div className="h-12 rounded-xl bg-surfaceMuted/70 dark:bg-backgroundDark/60 animate-pulse" />
        <div className="h-10 rounded-xl bg-surfaceMuted/60 dark:bg-backgroundDark/50 animate-pulse" />
        <div className="h-32 rounded-xl bg-surfaceMuted/60 dark:bg-backgroundDark/50 animate-pulse" />
      </div>
    ),
  },
);

type UploadTrackModalProps = {
  isOpen: boolean;
  uploadError: string;
  selectedFile: File | null;
  metadata: TrackInfo;
  coverFile: File | null;
  coverPreview: string | null;
  uploading: boolean;
  onClose: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onCoverChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearCover: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function UploadTrackModal({
  isOpen,
  uploadError,
  selectedFile,
  metadata,
  coverFile,
  coverPreview,
  uploading,
  onClose,
  onFileChange,
  onInputChange,
  onCoverChange,
  onClearCover,
  onSubmit,
}: UploadTrackModalProps) {
  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add a track"
      eyebrow="Upload"
      size="lg"
    >
      {uploadError && (
        <p className="text-red-500 text-sm font-medium mt-1">{uploadError}</p>
      )}
      <div className="mt-4">
        <FileUploadForm
          selectedFile={selectedFile}
          metadata={metadata}
          coverFile={coverFile}
          coverPreview={coverPreview}
          uploading={uploading}
          onFileChange={onFileChange}
          onInputChange={onInputChange}
          onCoverChange={onCoverChange}
          onClearCover={onClearCover}
          onSubmit={onSubmit}
        />
      </div>
    </GlassModal>
  );
}
