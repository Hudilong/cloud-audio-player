export const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

export const loadImageFromDataUrl = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = src;
  });

export async function resizeImageToBlob(
  file: File,
  maxSize: number,
  outputType: 'image/webp' | 'image/jpeg' = 'image/webp',
  quality = 0.9,
): Promise<Blob> {
  const dataUrl = await readFileAsDataURL(file);
  const image = await loadImageFromDataUrl(dataUrl);

  const { width, height } = image;
  const aspectRatio = width / height;
  let targetWidth = width;
  let targetHeight = height;

  if (width > height && width > maxSize) {
    targetWidth = maxSize;
    targetHeight = Math.round(maxSize / aspectRatio);
  } else if (height >= width && height > maxSize) {
    targetHeight = maxSize;
    targetWidth = Math.round(maxSize * aspectRatio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, outputType, quality);
  });

  if (!blob) {
    throw new Error('Failed to generate image blob');
  }

  return blob;
}
