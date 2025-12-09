import React, { useContext } from 'react';
import { PlayerContext } from '@/context/PlayerContext';

function TrackInfoDisplay() {
  const playerContext = useContext(PlayerContext);

  if (!playerContext) {
    throw new Error('TrackInfoDisplay must be used within a PlayerProvider');
  }

  const { track } = playerContext;

  return (
    <div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm min-w-0">
      <span className="font-semibold text-ink dark:text-textDark truncate w-full text-center text-sm sm:text-base">
        {track?.title || 'No Title'}
      </span>
      <span className="text-xs sm:text-sm text-muted truncate w-full text-center">
        {track?.artist || 'Unknown Artist'}
      </span>
    </div>
  );
}

export default TrackInfoDisplay;
