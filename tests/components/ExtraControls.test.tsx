import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ExtraControls from '../../components/ExtraControls';
import { PlayerContext } from '@/context/PlayerContext';
import { createMockPlayerContext } from '../helpers/mockPlayerContext';

describe('ExtraControls', () => {
  it('throws without PlayerContext', () => {
    expect(() => render(<ExtraControls />)).toThrow(
      'ExtraControls must be used within a PlayerProvider',
    );
  });

  it('toggles shuffle/repeat and adjusts volume', () => {
    const setIsShuffle = vi.fn();
    const cycleRepeatMode = vi.fn();
    const handleVolumeChange = vi.fn();

    const context = createMockPlayerContext({
      isShuffle: false,
      repeatMode: 'off',
      volume: 0.3,
      setIsShuffle,
      cycleRepeatMode,
      handleVolumeChange,
    });

    render(
      <PlayerContext.Provider value={context}>
        <ExtraControls />
      </PlayerContext.Provider>,
    );

    fireEvent.click(screen.getByLabelText(/shuffle/i));
    fireEvent.click(screen.getByLabelText(/repeat off/i));

    fireEvent.click(screen.getByLabelText(/volume/i));
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '0.7' } });

    expect(setIsShuffle).toHaveBeenCalledWith(true);
    expect(cycleRepeatMode).toHaveBeenCalledTimes(1);
    expect(handleVolumeChange).toHaveBeenCalledWith(0.7);
  });
});
