import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import Player from '../../components/Player';
import { PlayerContext } from '@/context/PlayerContext';
import {
  buildTrack,
  createMockPlayerContext,
} from '../helpers/mockPlayerContext';

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line jsx-a11y/alt-text -- alt forwarded
    <img {...props} />
  ),
}));

describe('Player repeat behaviour', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('restarts the current track when repeat mode is track', async () => {
    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() =>
      Promise.resolve(),
    );
    vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(
      () => {},
    );

    const setCurrentTime = vi.fn();
    const setIsPlaying = vi.fn();
    const handleNext = vi.fn();

    const context = createMockPlayerContext({
      track: buildTrack({ id: 'track-123' }),
      repeatMode: 'track',
      setCurrentTime,
      setIsPlaying,
      handleNext,
    });

    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ streamURL: 'https://example.com/audio.mp3' }),
    } as unknown as Response);

    const { container } = render(
      <PlayerContext.Provider value={context}>
        <Player />
      </PlayerContext.Provider>,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      expect(container.querySelector('audio')).toBeTruthy();
    });

    const audio = container.querySelector('audio') as HTMLAudioElement;
    audio.play = vi.fn().mockResolvedValue(undefined);
    audio.currentTime = 12;

    fireEvent.ended(audio);

    expect(audio.play).toHaveBeenCalled();
    expect(audio.currentTime).toBe(0);
    expect(setCurrentTime).toHaveBeenCalledWith(0);
    expect(setIsPlaying).toHaveBeenCalledWith(true);
    expect(handleNext).not.toHaveBeenCalled();
  });
});
