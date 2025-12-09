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
    const setIsRepeat = vi.fn();
    const handleVolumeChange = vi.fn();

    const context = createMockPlayerContext({
      isShuffle: false,
      isRepeat: false,
      volume: 0.3,
      setIsShuffle,
      setIsRepeat,
      handleVolumeChange,
    });

    render(
      <PlayerContext.Provider value={context}>
        <ExtraControls />
      </PlayerContext.Provider>,
    );

    fireEvent.click(screen.getByLabelText(/shuffle/i));
    fireEvent.click(screen.getByLabelText(/repeat/i));

    fireEvent.click(screen.getByLabelText(/volume/i));
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '0.7' } });

    expect(setIsShuffle).toHaveBeenCalledWith(true);
    expect(setIsRepeat).toHaveBeenCalledWith(true);
    expect(handleVolumeChange).toHaveBeenCalledWith(0.7);
  });
});
