import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TrackInfoDisplay from '@components/tracks/TrackInfoDisplay';
import { PlayerContext } from '@/context/PlayerContext';
import {
  buildTrack,
  createMockPlayerContext,
} from '../helpers/mockPlayerContext';

describe('TrackInfoDisplay', () => {
  it('throws without PlayerContext', () => {
    expect(() => render(<TrackInfoDisplay />)).toThrow(
      'TrackInfoDisplay must be used within a PlayerProvider',
    );
  });

  it('shows fallback values when no track is active', () => {
    const context = createMockPlayerContext({ track: null });
    render(
      <PlayerContext.Provider value={context}>
        <TrackInfoDisplay />
      </PlayerContext.Provider>,
    );

    expect(screen.getByText('No Title')).toBeInTheDocument();
    expect(screen.getByText('Unknown Artist')).toBeInTheDocument();
  });

  it('renders current track details', () => {
    const track = buildTrack({ title: 'Glider', artist: 'Ecco' });
    const context = createMockPlayerContext({ track });

    render(
      <PlayerContext.Provider value={context}>
        <TrackInfoDisplay />
      </PlayerContext.Provider>,
    );

    expect(screen.getByText('Glider')).toBeInTheDocument();
    expect(screen.getByText('Ecco')).toBeInTheDocument();
  });
});
