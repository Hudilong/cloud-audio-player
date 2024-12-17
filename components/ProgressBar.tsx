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
    <div className="flex items-center w-full">
      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
        {formatTime(currentTime)}
      </span>
      <input
        type="range"
        min="0"
        max={track?.duration || 0}
        value={currentTime}
        onChange={(e) => handleSeek(parseFloat(e.target.value))}
        className="flex-1 mx-2 h-1 sm:h-2 appearance-none bg-gray-300 dark:bg-gray-700 rounded-full accent-gray-600 dark:accent-gray-400"
      />
      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
        {formatTime(track?.duration || 0)}
      </span>
    </div>
  );
}

export default ProgressBar;
