import { decode } from 'blurhash';

const cache = new Map<string, string>();

export function blurhashToDataURL(
  blurhash?: string | null,
  width = 32,
  height = 32,
): string | null {
  if (!blurhash) return null;
  const cached = cache.get(blurhash);
  if (cached) return cached;

  try {
    const pixels = decode(blurhash, width, height);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = width;
    canvas.height = height;

    const imageData = ctx.createImageData(width, height);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    cache.set(blurhash, dataUrl);
    return dataUrl;
  } catch {
    return null;
  }
}
