import { encode } from 'blurhash';
import { readFileAsDataURL, loadImageFromDataUrl } from './imageProcessing';

export async function generateBlurhashFromFile(
  file: File,
  maxSize = 64,
  componentsX = 4,
  componentsY = 4,
): Promise<string> {
  const dataUrl = await readFileAsDataURL(file);
  const image = await loadImageFromDataUrl(dataUrl);

  const width = Math.min(maxSize, image.width);
  const height = Math.min(maxSize, image.height);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to get canvas context for blurhash');
  }

  context.drawImage(image, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);
  const blurhash = encode(
    imageData.data,
    imageData.width,
    imageData.height,
    componentsX,
    componentsY,
  );

  return blurhash;
}
