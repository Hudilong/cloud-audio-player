import React, { useContext } from 'react';
import { PlayerContext } from '@/context/PlayerContext';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { FaVolumeUp, FaVolumeMute, FaRandom, FaRedo } from 'react-icons/fa';

function ExtraControls() {
  const playerContext = useContext(PlayerContext);

  if (!playerContext) {
    throw new Error('ExtraControls must be used within a PlayerProvider');
  }

  const {
    volume,
    handleVolumeChange,
    isShuffle,
    setIsShuffle,
    isRepeat,
    setIsRepeat,
  } = playerContext;

  return (
    <div className="flex items-center space-x-4 relative">
      {/* Shuffle Button */}
      <button
        type="button"
        onClick={() => setIsShuffle(!isShuffle)}
        className={`text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white ${
          isShuffle ? 'text-accentLight dark:text-accentDark' : ''
        }`}
        aria-label="Shuffle"
      >
        <FaRandom color={isShuffle ? '#FF6EC7' : ''} />
      </button>

      {/* Repeat Button */}
      <button
        type="button"
        onClick={() => setIsRepeat(!isRepeat)}
        className={`text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white ${
          isRepeat ? 'text-accentLight dark:text-accentDark' : ''
        }`}
        aria-label="Repeat"
      >
        <FaRedo color={isRepeat ? '#FF6EC7' : ''} />
      </button>

      {/* Volume Control */}
      <Popover className="relative">
        <PopoverButton
          className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
          aria-label="Volume"
        >
          {volume > 0 ? <FaVolumeUp /> : <FaVolumeMute />}
        </PopoverButton>
        <PopoverPanel className="absolute right-0 bottom-10 mb-2 w-8 bg-white dark:bg-gray-800 p-2 rounded shadow-lg flex items-center">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="volume-slider"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: 'center',
            }}
          />
        </PopoverPanel>
      </Popover>
    </div>
  );
}

export default ExtraControls;
