import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  uploadCoverAndGetMeta,
  requestUploadUrl,
  uploadFileToUrl,
  saveTrack,
  extractEmbeddedCover,
} from '../../services/trackUpload';

const buildFile = (name: string, type: string, size = 1) =>
  new File([new Uint8Array(size)], name, { type });

afterEach(() => {
  vi.restoreAllMocks();
});

describe('trackUpload service helpers', () => {
  it('returns null meta when no cover provided', async () => {
    const meta = await uploadCoverAndGetMeta(null);
    expect(meta).toEqual({ imageURL: null, imageBlurhash: null });
  });

  it('requests upload url and throws on non-200', async () => {
    const file = buildFile('song.mp3', 'audio/mpeg');
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'x' }),
      } as Response);

    await expect(requestUploadUrl(file)).rejects.toBeInstanceOf(Error);
    expect(fetchMock).toHaveBeenCalled();
  });

  it('uploads file to url and throws on failure', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: false } as Response);
    await expect(
      uploadFileToUrl('http://upload', buildFile('f', 'audio/mpeg')),
    ).rejects.toBeInstanceOf(Error);
  });

  it('saves track and throws on failure', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'nope' }),
    } as Response);
    await expect(
      saveTrack(
        {
          title: 't',
          artist: 'a',
          album: 'b',
          duration: 1,
          genre: 'g',
          imageURL: null,
          imageBlurhash: null,
          isFeatured: false,
          s3Key: 'k',
        },
        '/api/save',
      ),
    ).rejects.toBeInstanceOf(Error);
  });

  it('extracts embedded cover', async () => {
    const metadataResult = {
      common: {
        picture: [
          {
            format: 'image/png',
            data: new Uint8Array([1, 2, 3]),
          },
        ],
      },
    };

    const { embeddedFile, preview } =
      await extractEmbeddedCover(metadataResult);
    expect(embeddedFile).not.toBeNull();
    expect(preview).toContain('data:image/png');
  });
});
