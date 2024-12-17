import React, { useContext } from 'react';
import { PlayerContext } from '@/context/PlayerContext';
import { FaPlay, FaPause, FaArrowLeft, FaArrowRight } from 'react-icons/fa';

function PlayerControls() {
  const playerContext = useContext(PlayerContext);

  if (!playerContext) {
    throw new Error('PlayerControls must be used within a PlayerProvider');
  }

  const { isPlaying, handleNext, handlePrevious, togglePlayPause } =
    playerContext;

  return (
    <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-300">
      {/* Previous Button */}
      <button
        type="button"
        onClick={handlePrevious}
        className="hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
      >
        <FaArrowLeft />
      </button>

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlayPause}
        className="hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
      >
        {isPlaying ? <FaPause /> : <FaPlay />}
      </button>

      {/* Next Button */}
      <button
        type="button"
        onClick={handleNext}
        className="hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
      >
        <FaArrowRight />
      </button>
    </div>
  );
}

export default PlayerControls;
