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
    repeatMode,
    cycleRepeatMode,
  } = playerContext;

  const repeatLabelMap: Record<typeof repeatMode, string> = {
    off: 'Repeat off',
    queue: 'Repeat queue',
    track: 'Repeat track',
  };
  const repeatLabel = repeatLabelMap[repeatMode];

  return (
    <div className="flex items-center gap-3 sm:gap-4 relative text-ink/70 dark:text-textDark">
      <button
        type="button"
        onClick={() => setIsShuffle(!isShuffle)}
        className={`p-2 rounded-full hover:bg-panelLightAlt dark:hover:bg-panelDarkAlt hover:text-ink dark:hover:text-textDark transition-colors ${
          isShuffle ? 'text-accentDark' : ''
        }`}
        aria-label="Shuffle"
      >
        <FiShuffle className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={cycleRepeatMode}
        className={`p-2 rounded-full hover:bg-panelLightAlt dark:hover:bg-panelDarkAlt hover:text-ink dark:hover:text-textDark transition-colors h-10 w-10 flex items-center justify-center ${
          repeatMode !== 'off' ? 'text-accentDark' : ''
        }`}
        aria-label={repeatLabel}
        title={repeatLabel}
      >
        <span className="relative inline-flex">
          <FiRepeat className="h-5 w-5" />
          {repeatMode === 'queue' && (
            <span className="absolute -right-1 -top-1 text-[10px] font-semibold">
              A
            </span>
          )}
          {repeatMode === 'track' && (
            <span className="absolute -right-1 -top-1 text-[10px] font-semibold">
              1
            </span>
          )}
        </span>
      </button>

      <Popover className="relative">
        <PopoverButton
          className="p-2 rounded-full hover:bg-panelLightAlt dark:hover:bg-panelDarkAlt transition-colors border border-borderLight dark:border-borderDark bg-panelLight dark:bg-panelDark shadow-soft"
          aria-label="Volume"
        >
          {volume > 0 ? (
            <FiVolume2 className="h-5 w-5" />
          ) : (
            <FiVolumeX className="h-5 w-5" />
          )}
        </PopoverButton>
        <PopoverPanel className="absolute right-0 sm:right-0 bottom-16 sm:bottom-18 w-14 bg-panelLight dark:bg-panelDark border border-borderLight dark:border-borderDark rounded-2xl shadow-glass p-2.5 flex flex-col items-center gap-2 backdrop-blur origin-bottom z-[90]">
          <span className="text-[11px] font-semibold text-muted">Vol</span>
          <div className="relative h-24 w-5 rounded-full bg-gradient-to-b from-white/60 via-surfaceMuted/70 to-white/50 dark:from-backgroundDark/60 dark:via-backgroundDark/70 dark:to-backgroundDark/60 overflow-hidden">
            <div
              className="absolute bottom-0 left-0 right-0 rounded-full bg-gradient-to-t from-accentLight via-pastelPurple to-accentLight pointer-events-none"
              style={{ height: `${Math.min(volume * 100, 100)}%` }}
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              style={{ writingMode: 'vertical-rl' as const, direction: 'rtl' }}
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
