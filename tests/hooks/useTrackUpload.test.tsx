import type React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { parseBlob } from 'music-metadata-browser';
import { useTrackUpload } from '@/hooks/useTrackUpload';

vi.mock('music-metadata-browser', () => ({
  parseBlob: vi.fn(),
}));

class MockFileReader {
  public result: string | ArrayBuffer | null = null;

  public onloadend: (() => void) | null = null;

  public onerror: (() => void) | null = null;

  readAsDataURL() {
    this.result = 'data:audio/mpeg;base64,ZmFrZQ==';
    queueMicrotask(() => this.onloadend?.());
  }
}

describe('useTrackUpload', () => {
  const originalFetch = global.fetch;
  const parseBlobMock = vi.mocked(parseBlob);

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    vi.stubGlobal('FileReader', MockFileReader);
    parseBlobMock.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllGlobals();
  });

  it('populates metadata when a file is chosen', async () => {
    parseBlobMock.mockResolvedValue({
      common: {
        title: 'Mock Song',
        artist: 'Mock Artist',
        album: 'Mock Album',
        genre: ['Indie'],
      },
      format: { duration: 183.9 },
    } as never);

    const { result } = renderHook(() => useTrackUpload());
    const file = new File(['audio'], 'song.mp3', { type: 'audio/mpeg' });
    const changeEvent = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(changeEvent);
    });

    expect(parseBlobMock).toHaveBeenCalledWith(file);
    expect(result.current.selectedFile).toBe(file);
    expect(result.current.trackInfo).toEqual({
      title: 'Mock Song',
      artist: 'Mock Artist',
      album: 'Mock Album',
      duration: 183,
      genre: 'Indie',
      imageURL: null,
    });
    expect(result.current.uploadError).toBe('');
  });

  it('surfaces metadata extraction failures', async () => {
    parseBlobMock.mockRejectedValue(new Error('bad metadata'));

    const { result } = renderHook(() => useTrackUpload());
    const file = new File(['audio'], 'song.mp3', { type: 'audio/mpeg' });
    const changeEvent = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(changeEvent);
    });

    expect(result.current.uploadError).toBe('Failed to extract metadata.');
    expect(result.current.trackInfo.title).toBe('');
  });

  it('blocks submitting when no file is selected', async () => {
    const { result } = renderHook(() => useTrackUpload());
    const submitEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.FormEvent<HTMLFormElement>;

    await act(async () => {
      await result.current.handleUploadSubmit(submitEvent);
    });

    expect(result.current.uploadError).toBe('No file selected');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sets upload errors from the upload-url response', async () => {
    parseBlobMock.mockResolvedValue({
      common: { title: '', artist: '', album: '', genre: ['Pop'] },
      format: { duration: 120 },
    } as never);

    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: 'Upload service unavailable' }),
    });

    const { result } = renderHook(() => useTrackUpload());
    const file = new File(['audio'], 'song.mp3', { type: 'audio/mpeg' });
    const changeEvent = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileChange(changeEvent);
    });

    const submitEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.FormEvent<HTMLFormElement>;

    await act(async () => {
      await result.current.handleUploadSubmit(submitEvent);
    });

    await waitFor(() =>
      expect(result.current.uploadError).toBe('Upload service unavailable'),
    );
    expect(result.current.uploading).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('uploads successfully and resets state', async () => {
    const onSuccess = vi.fn();
    parseBlobMock.mockResolvedValue({
      common: {
        title: 'Song',
        artist: 'Artist',
        album: 'Album',
        genre: ['Alt'],
      },
      format: { duration: 200 },
    } as never);

    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          uploadURL: 'https://upload.test',
          key: 'file-key',
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { result } = renderHook(() => useTrackUpload({ onSuccess }));
    const file = new File(['audio'], 'song.mp3', { type: 'audio/mpeg' });

    await act(async () => {
      await result.current.handleFileChange({
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.openUploadModal();
    });

    const submitEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.FormEvent<HTMLFormElement>;

    await act(async () => {
      await result.current.handleUploadSubmit(submitEvent);
    });

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    await waitFor(() => expect(result.current.uploading).toBe(false));

    expect(result.current.uploadModalOpen).toBe(false);
    expect(result.current.selectedFile).toBeNull();
    expect(result.current.trackInfo.title).toBe('');
    expect(result.current.uploadError).toBe('');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
