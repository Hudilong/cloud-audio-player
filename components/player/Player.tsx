'use client';

import React, { useContext, useEffect, useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { PlayerContext } from '@/context/PlayerContext';
import TrackInfoDisplay from '@components/tracks/TrackInfoDisplay';
import CoverImage from '@components/ui/CoverImage';
import { TrackWithCover } from '@app-types/trackWithCover';
import PlayerControls from './PlayerControls';
import ExtraControls from './ExtraControls';
import ProgressBar from './ProgressBar';
import QueueDrawer from './QueueDrawer';

export default function Player() {
  const playerContext = useContext(PlayerContext);
  const [streamURL, setStreamURL] = useState<string | null>(null);

  if (!playerContext) {
    throw new Error('Player must be used within a PlayerProvider');
  }

  const {
    audioRef,
    track,
    repeatMode,
    setCurrentTime,
    setIsPlaying,
    attemptPlay,
    handleNext,
    currentTime,
    isPlaying,
    queue,
    currentTrackIndex,
    reorderUpcoming,
    removeUpcoming,
    clearUpcoming,
  } = playerContext;
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function fetchStreamURL(id: string) {
      try {
        const res = await fetch(`/api/tracks/stream-url?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            setStreamURL(data.streamURL);
          }
        } else if (!isCancelled) {
          setStreamURL('');
        }
      } catch {
        if (!isCancelled) setStreamURL('');
      }
    }
    if (track && track.id) {
      setStreamURL('');
      fetchStreamURL(track.id);
    } else {
      setStreamURL(null);
    }
    return () => {
      isCancelled = true;
    };
  }, [track]);

  useEffect(() => {
    if (isPlaying && streamURL) {
      attemptPlay();
    }
  }, [attemptPlay, streamURL, isPlaying]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (isEditable) return;

      if (event.code === 'Space') {
        event.preventDefault();
        playerContext.togglePlayPause();
      } else if (
        (event.metaKey || event.ctrlKey) &&
        (event.key === 'ArrowUp' || event.key === 'ArrowLeft')
      ) {
        event.preventDefault();
        playerContext.handlePrevious();
      } else if (
        (event.metaKey || event.ctrlKey) &&
        (event.key === 'ArrowDown' || event.key === 'ArrowRight')
      ) {
        event.preventDefault();
        playerContext.handleNext();
      }
    };

    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [playerContext]);

  if (!track) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 px-2.5 sm:px-6 pb-2 sm:pb-3">
      <div className="max-w-6xl mx-auto relative rounded-3xl bg-white/85 dark:bg-backgroundDark/90 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-glass px-3 sm:px-5 py-2.5 sm:py-4 overflow-visible">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -left-10 -bottom-14 h-40 w-40 bg-pastelPurple blur-3xl" />
          <div className="absolute right-0 -top-10 h-36 w-36 bg-accentLight blur-3xl" />
        </div>

        <audio
          ref={audioRef}
          src={streamURL || undefined}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            if (!audioRef.current) return;
            if (currentTime > 0) {
              audioRef.current.currentTime = currentTime;
            }
            if (isPlaying) {
              attemptPlay();
            }
          }}
          onEnded={() => {
            if (repeatMode === 'track') {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                attemptPlay();
              }
              setCurrentTime(0);
              setIsPlaying(true);
            } else {
              handleNext({ fromEnded: true });
            }
          }}
        />

        {isCollapsed ? (
          <div className="relative flex items-center gap-2 sm:gap-3">
            {(() => {
              const trackWithCover = track as TrackWithCover;
              return (
                <CoverImage
                  track={trackWithCover}
                  width={48}
                  height={48}
                  alt={track.title || 'track'}
                  className="rounded-2xl w-10 h-10 object-cover border border-white/70 dark:border-white/10 shadow-soft flex-shrink-0"
                />
              );
            })()}
            <div className="flex-1 min-w-0">
              <TrackInfoDisplay />
            </div>
            <div className="ml-auto flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <PlayerControls />
              <button
                type="button"
                onClick={() => setIsCollapsed(false)}
                className="p-2 rounded-full bg-white/70 dark:bg-backgroundDark/70 border border-white/60 dark:border-white/10 text-muted hover:text-textLight"
                aria-label="Expand player"
              >
                <FiChevronUp />
              </button>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col gap-2 sm:gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              {(() => {
                const trackWithCover = track as TrackWithCover;
                return (
                  <CoverImage
                    track={trackWithCover}
                    width={56}
                    height={56}
                    alt={track.title || 'track'}
                    className="rounded-2xl w-10 h-10 sm:w-12 sm:h-12 object-cover border border-white/70 dark:border-white/10 shadow-soft flex-shrink-0"
                  />
                );
              })()}
              <TrackInfoDisplay />
              <div className="hidden sm:flex ml-auto">
                <ExtraControls />
              </div>
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="ml-2 inline-flex sm:hidden items-center justify-center p-2 rounded-full bg-white/70 dark:bg-backgroundDark/70 border border-white/60 dark:border-white/10 text-muted hover:text-textLight"
                aria-label="Collapse player"
              >
                <FiChevronDown />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
              <PlayerControls />
              <div className="flex items-center gap-3">
                <QueueDrawer
                  queue={queue}
                  currentTrackIndex={currentTrackIndex}
                  onReorder={reorderUpcoming}
                  onRemove={removeUpcoming}
                  onClear={clearUpcoming}
                />
                <div className="sm:hidden">
                  <ExtraControls />
                </div>
              </div>
            </div>

            <ProgressBar />
          </div>
        )}
      </div>
    </div>
  );
}
