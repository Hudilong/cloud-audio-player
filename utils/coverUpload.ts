import { readFileAsDataURL, resizeImageToBlob } from './imageProcessing';

type UploadVariantsResponse = {
  variants: Record<
    string,
    { key: string; uploadURL: string; contentType: string }
  >;
};

export async function uploadCoverVariants(
  coverFile: File,
): Promise<string | null> {
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

  const signerData = (await signerResponse.json()) as UploadVariantsResponse;

  if (!signerResponse.ok || (signerData as any).error) {
    throw new Error(
      (signerData as any).error || 'Failed to prepare cover upload',
    );
  }

  const largeBlob = await resizeImageToBlob(coverFile, 1200, 'image/webp');
  const thumbBlob = await resizeImageToBlob(coverFile, 320, 'image/webp');

  const uploads: Array<{
    blob: Blob | File;
    variant: { key: string; uploadURL: string; contentType: string };
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

  return primaryKey || null;
}
