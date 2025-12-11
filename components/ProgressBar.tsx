import React, { useContext, useMemo, useRef, useState } from 'react';
import { PlayerContext } from '@/context/PlayerContext';
import { formatTime } from '../utils/formatTime';

function ProgressBar() {
  const playerContext = useContext(PlayerContext);

  if (!playerContext) {
    throw new Error('ProgressBar must be used within a PlayerProvider');
  }

  const { track, currentTime, handleSeek } = playerContext;
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const hoverPercent = useMemo(() => {
    if (!track?.duration || !hoverTime) return 0;
    return Math.min(Math.max((hoverTime / track.duration) * 100, 0), 100);
  }, [hoverTime, track?.duration]);

  const progressPercent = useMemo(() => {
    if (!track?.duration) return 0;
    return Math.min((currentTime / track.duration) * 100, 100);
  }, [currentTime, track?.duration]);

  const handleHover = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!track?.duration) return;
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = event.clientX - rect.left;
    const ratio = Math.min(Math.max(x / rect.width, 0), 1);
    setHoverTime(ratio * track.duration);
  };

  const clearHover = () => setHoverTime(null);

  return (
    <div className="flex items-center w-full gap-2">
      <span className="text-[11px] sm:text-xs text-muted">
        {formatTime(currentTime)}
      </span>
      <div
        ref={barRef}
        className="relative flex-1 h-3"
        onMouseMove={handleHover}
        onMouseLeave={clearHover}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/70 via-surfaceMuted to-white/70 dark:from-backgroundDark/60 dark:via-backgroundDark/70 dark:to-backgroundDark/60 shadow-inner" />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-pastelPurple to-accentLight pointer-events-none"
          style={{ width: `${progressPercent}%` }}
        />
        {hoverTime !== null && (
          <>
            <div
              className="absolute inset-y-0 w-px bg-accentDark/70 pointer-events-none"
              style={{ left: `${hoverPercent}%` }}
            />
            <div
              className="absolute -top-7 -translate-x-1/2 px-2 py-1 rounded-full bg-panelLight dark:bg-panelDark border border-borderLight dark:border-borderDark text-[11px] font-semibold text-ink dark:text-textDark shadow-soft pointer-events-none"
              style={{ left: `${hoverPercent}%` }}
            >
              {formatTime(hoverTime)}
            </div>
          </>
        )}
        <input
          type="range"
          min="0"
          max={track?.duration || 0}
          value={currentTime}
          onChange={(e) => handleSeek(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
      <span className="text-[11px] sm:text-xs text-muted">
        {formatTime(track?.duration || 0)}
      </span>
    </div>
  );
}

export default ProgressBar;
