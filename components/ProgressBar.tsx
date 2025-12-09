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
    <div className="flex items-center w-full gap-2">
      <span className="text-[11px] sm:text-xs text-muted">
        {formatTime(currentTime)}
      </span>
      <input
        type="range"
        min="0"
        max={track?.duration || 0}
        value={currentTime}
        onChange={(e) => handleSeek(parseFloat(e.target.value))}
        className="flex-1 h-2 appearance-none rounded-full bg-gradient-to-r from-white/70 via-surfaceMuted to-white/70 dark:from-backgroundDark/60 dark:via-backgroundDark/70 dark:to-backgroundDark/60 accent-accentDark cursor-pointer shadow-inner"
      />
      <span className="text-[11px] sm:text-xs text-muted">
        {formatTime(track?.duration || 0)}
      </span>
    </div>
  );
}

export default ProgressBar;
