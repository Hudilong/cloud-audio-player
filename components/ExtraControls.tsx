import React, { useContext } from 'react';
import { PlayerContext } from '@/context/PlayerContext';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { FiVolume2, FiVolumeX, FiShuffle, FiRepeat } from 'react-icons/fi';

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
    <div className="flex items-center gap-3 sm:gap-4 relative text-ink/70 dark:text-textDark">
      <button
        type="button"
        onClick={() => setIsShuffle(!isShuffle)}
        className={`p-2 rounded-full hover:bg-surfaceMuted/60 dark:hover:bg-backgroundDark/80 transition-colors ${
          isShuffle ? 'text-accentDark' : ''
        }`}
        aria-label="Shuffle"
      >
        <FiShuffle className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={() => setIsRepeat(!isRepeat)}
        className={`p-2 rounded-full hover:bg-surfaceMuted/60 dark:hover:bg-backgroundDark/80 transition-colors ${
          isRepeat ? 'text-accentDark' : ''
        }`}
        aria-label="Repeat"
      >
        <FiRepeat className="h-5 w-5" />
      </button>

      <Popover className="relative">
        <PopoverButton
          className="p-2 rounded-full hover:bg-surfaceMuted/80 dark:hover:bg-backgroundDark/80 transition-colors border border-white/40 dark:border-white/10 bg-white/50 dark:bg-backgroundDark/70 shadow-soft"
          aria-label="Volume"
        >
          {volume > 0 ? (
            <FiVolume2 className="h-5 w-5" />
          ) : (
            <FiVolumeX className="h-5 w-5" />
          )}
        </PopoverButton>

        <PopoverPanel className="absolute right-0 sm:right-0 bottom-16 sm:bottom-18 w-16 bg-white/95 dark:bg-backgroundDark/95 border border-white/60 dark:border-white/10 rounded-2xl shadow-glass p-3 flex flex-col items-center gap-2 backdrop-blur origin-bottom z-[90]">
          <span className="text-[11px] font-semibold text-muted">Vol</span>
          <div className="relative h-28 flex items-center justify-center px-1">
            <div className="absolute inset-x-1 h-full rounded-full bg-gradient-to-b from-pastelPurple/20 via-accentLight/15 to-backgroundDark/20" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="relative h-28 w-4 [writing-mode:vertical-rl] [direction:rtl] accent-accentDark cursor-pointer bg-transparent"
            />
          </div>
          <span className="text-[11px] text-muted">
            {Math.round(volume * 100)}%
          </span>
        </PopoverPanel>
      </Popover>
    </div>
  );
}

export default ExtraControls;
