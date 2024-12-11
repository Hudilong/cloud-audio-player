import React, { useContext } from 'react';
import { PlayerContext } from '@/context/PlayerContext';
import { formatTime } from '../utils/formatTime';

function ProgressBar() {
  const playerContext = useContext(PlayerContext);

  if (!playerContext) {
    throw new Error('ProgressBar must be used within a PlayerProvider');
  }

  const { track, currentTime, handleSeek } = playerContext;

  return (
    <div className="flex items-center mt-2">
      <span className="text-xs text-gray-600 dark:text-gray-400">
        {formatTime(currentTime)}
      </span>
      <input
        type="range"
        min="0"
        max={track?.duration || 0}
        value={currentTime}
        onChange={(e) => handleSeek(parseFloat(e.target.value))}
        className="flex-1 mx-2"
      />
      <span className="text-xs text-gray-600 dark:text-gray-400">
        {formatTime(track?.duration || 0)}
      </span>
    </div>
  );
}

export default ProgressBar;
