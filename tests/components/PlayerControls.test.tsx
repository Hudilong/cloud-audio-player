import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PlayerControls from '@components/player/PlayerControls';
import { PlayerContext } from '@/context/PlayerContext';
import { createMockPlayerContext } from '../helpers/mockPlayerContext';

describe('PlayerControls', () => {
  it('throws when rendered without PlayerContext', () => {
    expect(() => render(<PlayerControls />)).toThrow(
      'PlayerControls must be used within a PlayerProvider',
    );
  });

  it('invokes playback controls from context', () => {
    const togglePlayPause = vi.fn();
    const handlePrevious = vi.fn();
    const handleNext = vi.fn();
    const context = createMockPlayerContext({
      togglePlayPause,
      handlePrevious,
      handleNext,
      isPlaying: true,
    });

    render(
      <PlayerContext.Provider value={context}>
        <PlayerControls />
      </PlayerContext.Provider>,
    );

    fireEvent.click(screen.getByLabelText(/previous/i));
    fireEvent.click(screen.getByLabelText(/pause/i));
    fireEvent.click(screen.getByLabelText(/next/i));

    expect(handlePrevious).toHaveBeenCalledTimes(1);
    expect(togglePlayPause).toHaveBeenCalledTimes(1);
    expect(handleNext).toHaveBeenCalledTimes(1);
  });
});
