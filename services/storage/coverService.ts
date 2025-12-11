import { readFileAsDataURL, resizeImageToBlob } from '@utils/imageProcessing';
import { generateBlurhashFromFile } from '@utils/blurhash';

export type CoverUploadResult = {
  imageURL: string | null;
  imageBlurhash: string | null;
};

export async function uploadCoverVariantsWithBlurhash(coverFile: File) {
  const dataUrl = await readFileAsDataURL(coverFile);
  const base64Buffer = dataUrl.split(',')[1];

  const signerResponse = await fetch('/api/tracks/cover-upload-url', {
    method: 'POST',
    body: JSON.stringify({
      fileBuffer: base64Buffer,
      type: coverFile.type,
    }),
    headers: { 'Content-Type': 'application/json' },
  });

  const signerData = await signerResponse.json();

  if (!signerResponse.ok || signerData.error) {
    throw new Error(signerData.error || 'Failed to prepare cover upload');
  }

  const largeBlob = await resizeImageToBlob(coverFile, 1200, 'image/webp');
  const thumbBlob = await resizeImageToBlob(coverFile, 320, 'image/webp');

  const uploads: Array<{
    blob: Blob | File;
    variant: {
      key: string;
      uploadURL: string;
      contentType: string;
    };
  }> = [
    {
      blob: coverFile,
      variant: signerData.variants.original,
    },
    { blob: largeBlob, variant: signerData.variants.large },
    { blob: thumbBlob, variant: signerData.variants.thumb },
  ];

  await Promise.all(
    uploads.map(async ({ blob, variant }) => {
      await fetch(variant.uploadURL, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': variant.contentType },
      });
    }),
  );

  const primaryKey =
    signerData.variants.large?.key || signerData.variants.original?.key;

  const imageURL = primaryKey || null;
  const imageBlurhash = await generateBlurhashFromFile(coverFile);

  return { imageURL, imageBlurhash } as CoverUploadResult;
}
