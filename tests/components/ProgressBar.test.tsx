import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProgressBar from '../../components/ProgressBar';
import { PlayerContext } from '@/context/PlayerContext';
import {
  buildTrack,
  createMockPlayerContext,
} from '../helpers/mockPlayerContext';

describe('ProgressBar', () => {
  it('throws when no context is provided', () => {
    expect(() => render(<ProgressBar />)).toThrow(
      'ProgressBar must be used within a PlayerProvider',
    );
  });

  it('displays times and seeks via context handler', () => {
    const handleSeek = vi.fn();
    const context = createMockPlayerContext({
      currentTime: 65,
      handleSeek,
      track: buildTrack({ duration: 200 }),
    });

    render(
      <PlayerContext.Provider value={context}>
        <ProgressBar />
      </PlayerContext.Provider>,
    );

    expect(screen.getByText('1:05')).toBeInTheDocument();
    expect(screen.getByText('3:20')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('slider'), { target: { value: '120' } });
    expect(handleSeek).toHaveBeenCalledWith(120);
  });
});
