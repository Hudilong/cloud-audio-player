import { uploadCoverVariantsWithBlurhash } from '@services/storage/coverService';
import { TrackInfo } from '../types';
import { getFriendlyMessage, parseApiError } from '../utils/apiError';
import { readFileAsDataURL } from '../utils/imageProcessing';

export async function uploadCoverAndGetMeta(
  coverFile: File | null,
): Promise<{ imageURL: string | null; imageBlurhash: string | null }> {
  if (!coverFile) {
    return { imageURL: null, imageBlurhash: null };
  }
  const result = await uploadCoverVariantsWithBlurhash(coverFile);
  return { imageURL: result.imageURL, imageBlurhash: result.imageBlurhash };
}

export async function requestUploadUrl(selectedFile: File) {
  const reader = new FileReader();

  const base64Buffer: string = await new Promise((resolve, reject) => {
    reader.onloadend = () => {
      const buffer = reader.result?.toString().split(',')[1];
      if (!buffer) reject(new Error('Unable to read file'));
      else resolve(buffer);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(selectedFile);
  });

  const response = await fetch('/api/tracks/upload-url', {
    method: 'POST',
    body: JSON.stringify({
      name: selectedFile.name,
      type: selectedFile.type,
      fileBuffer: base64Buffer,
    }),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const apiError = await parseApiError(response);
    throw new Error(getFriendlyMessage(apiError));
  }

  const { uploadURL, key, error } = await response.json();
  if (error) throw new Error(getFriendlyMessage(new Error(error)));
  if (!uploadURL || !key) throw new Error('Failed to prepare upload URL');

  return { uploadURL, key };
}

export async function uploadFileToUrl(
  uploadURL: string,
  file: File,
): Promise<void> {
  const uploadResponse = await fetch(uploadURL, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  if (!uploadResponse.ok) throw new Error('Failed to upload file');
}

export async function saveTrack(
  payload: TrackInfo & { s3Key: string },
  saveEndpoint: string,
) {
  const saveResponse = await fetch(saveEndpoint, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  });
  if (!saveResponse.ok) {
    const apiError = await parseApiError(saveResponse);
    throw new Error(getFriendlyMessage(apiError));
  }
  return saveResponse.json();
}

export const extractEmbeddedCover = async (metadataResult: {
  common: { picture?: Array<{ format?: string; data: Buffer }> };
}) => {
  const coverPicture = metadataResult.common.picture?.[0];
  if (!coverPicture) return { embeddedFile: null, preview: null };
  const mime = coverPicture.format || 'image/jpeg';
  const embeddedBlob = new Blob([coverPicture.data], { type: mime });
  const embeddedFile = new File([embeddedBlob], 'embedded-cover', {
    type: mime,
  });
  const preview = await readFileAsDataURL(embeddedFile);
  return { embeddedFile, preview };
};
