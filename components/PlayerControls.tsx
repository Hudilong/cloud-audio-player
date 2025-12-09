import React, { useContext } from 'react';
import { PlayerContext } from '@/context/PlayerContext';
import { FiPause, FiPlay, FiSkipBack, FiSkipForward } from 'react-icons/fi';

function PlayerControls() {
  const playerContext = useContext(PlayerContext);

  if (!playerContext) {
    throw new Error('PlayerControls must be used within a PlayerProvider');
  }

  const { isPlaying, handleNext, handlePrevious, togglePlayPause } =
    playerContext;

  return (
    <div className="flex items-center gap-3 sm:gap-4 text-ink/70 dark:text-textDark">
      <button
        type="button"
        onClick={handlePrevious}
        className="p-2 rounded-full hover:bg-panelLightAlt dark:hover:bg-panelDarkAlt hover:text-ink dark:hover:text-textDark transition-colors"
        aria-label="Previous"
      >
        <FiSkipBack className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={togglePlayPause}
        className="p-3 rounded-full bg-gradient-to-r from-pastelPurple to-accentLight text-white shadow-soft hover:shadow-glass transition-all"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <FiPause className="h-5 w-5" />
        ) : (
          <FiPlay className="h-5 w-5" />
        )}
      </button>

      <button
        type="button"
        onClick={handleNext}
        className="p-2 rounded-full hover:bg-panelLightAlt dark:hover:bg-panelDarkAlt hover:text-ink dark:hover:text-textDark transition-colors"
        aria-label="Next"
      >
        <FiSkipForward className="h-5 w-5" />
      </button>
    </div>
  );
}

export default PlayerControls;
