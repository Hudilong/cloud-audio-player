'use client';

/* eslint-disable react/jsx-props-no-spreading */
import React, { useMemo, useState } from 'react';
import { Track } from '@prisma/client';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiMenu, FiX, FiRotateCcw, FiTrash2, FiList } from 'react-icons/fi';
import { formatTime } from '../utils/formatTime';
import { TrackWithCover } from '../types/trackWithCover';
import CoverImage from './ui/CoverImage';

type QueueDrawerProps = {
  queue: TrackWithCover[];
  currentTrackIndex: number;
  onReorder: (trackIds: string[]) => void;
  onRemove: (trackId: string) => void;
  onClear: () => void;
};

type SortableItemProps = {
  track: TrackWithCover;
  onRemove: (trackId: string) => void;
};

function SortableItem({ track, onRemove }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 rounded-xl border border-borderLight dark:border-borderDark bg-panelLightAlt dark:bg-panelDark hover:shadow-glass"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="p-2 rounded-full bg-panelLight dark:bg-panelDark text-muted border border-borderLight dark:border-borderDark hover:text-ink dark:hover:text-textDark cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <FiMenu />
      </button>
      <CoverImage
        track={track}
        width={40}
        height={40}
        alt={track.title || 'Track'}
        className="h-10 w-10 rounded-lg object-cover border border-white/70 dark:border-white/10"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink dark:text-textDark truncate">
          {track.title || 'Untitled'}
        </p>
        <p className="text-xs text-muted truncate">{track.artist || ''}</p>
      </div>
      <div className="text-xs text-muted">{formatTime(track.duration)}</div>
      <button
        type="button"
        onClick={() => onRemove(track.id)}
        className="p-2 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
        aria-label="Remove from queue"
      >
        <FiTrash2 />
      </button>
    </li>
  );
}

export default function QueueDrawer({
  queue,
  currentTrackIndex,
  onReorder,
  onRemove,
  onClear,
}: QueueDrawerProps) {
  const [open, setOpen] = useState(false);
  const [lastRemoved, setLastRemoved] = useState<Track | null>(null);

  const upNext = useMemo(
    () => queue.slice(Math.max(currentTrackIndex + 1, 0)),
    [currentTrackIndex, queue],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = upNext.findIndex((t) => t.id === active.id);
    const newIndex = upNext.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(upNext, oldIndex, newIndex);
    onReorder(reordered.map((t) => t.id));
  };

  const handleRemove = (trackId: string) => {
    const removed = upNext.find((t) => t.id === trackId) || null;
    setLastRemoved(removed);
    onRemove(trackId);
  };

  const handleUndo = () => {
    if (!lastRemoved) return;
    const restored = [...upNext, lastRemoved];
    onReorder(restored.map((t) => t.id));
    setLastRemoved(null);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-borderLight dark:border-borderDark bg-panelLight dark:bg-panelDark text-sm font-semibold hover:shadow-glass"
        aria-expanded={open}
      >
        <FiList />
        Up next
        <span className="text-xs text-muted">({upNext.length})</span>
      </button>

      {open && (
        <div className="fixed inset-x-3 bottom-16 sm:absolute sm:inset-auto sm:right-0 sm:bottom-12 w-auto sm:w-80 max-h-[60vh] overflow-hidden rounded-2xl border border-borderLight dark:border-borderDark bg-panelLightAlt dark:bg-panelDark shadow-glass">
          <div className="flex items-center justify-between px-4 py-3 border-b border-borderLight dark:border-borderDark">
            <div>
              <p className="text-sm font-semibold text-ink dark:text-textDark">
                Up next
              </p>
              <p className="text-xs text-muted">
                Drag to reorder • Applies after current track
              </p>
            </div>
            <div className="flex items-center gap-2">
              {lastRemoved && (
                <button
                  type="button"
                  onClick={handleUndo}
                  className="p-2 rounded-full bg-panelLight dark:bg-panelDark text-muted hover:text-ink dark:hover:text-textDark border border-borderLight dark:border-borderDark"
                  aria-label="Undo remove"
                >
                  <FiRotateCcw />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-full bg-panelLight dark:bg-panelDark text-muted hover:text-ink dark:hover:text-textDark border border-borderLight dark:border-borderDark"
                aria-label="Close queue"
              >
                <FiX />
              </button>
            </div>
          </div>

          <div className="p-3 space-y-3 overflow-y-auto max-h-[50vh]">
            {upNext.length === 0 ? (
              <div className="text-sm text-muted text-center py-6">
                No upcoming tracks.
              </div>
            ) : (
              <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={upNext.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="space-y-2">
                    {upNext.map((track) => (
                      <SortableItem
                        key={track.id}
                        track={track}
                        onRemove={handleRemove}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </div>

          <div className="px-4 py-3 border-t border-borderLight dark:border-borderDark flex items-center justify-between">
            <span className="text-xs text-muted">{upNext.length} in queue</span>
            <button
              type="button"
              onClick={() => {
                onClear();
                setLastRemoved(null);
              }}
              className="text-xs font-semibold text-red-500 hover:text-red-600"
              disabled={upNext.length === 0}
            >
              Clear queue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
