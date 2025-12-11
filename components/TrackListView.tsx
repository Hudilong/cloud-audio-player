'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
import TrackItem from './TrackItem';

interface TrackListViewProps {
  tracks: Track[];
  onSelect: (track: Track) => void;
  onDelete: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onPlayNext: (track: Track) => void;
  onAddToPlaylist: (track: Track) => void;
  reorderable?: boolean;
  onReorder?: (orderedTrackIds: string[]) => void;
  onEdit?: (track: Track) => void;
}

function SortableTrack({
  track,
  onSelect,
  onDelete,
  onAddToQueue,
  onPlayNext,
  onAddToPlaylist,
  onEdit,
}: Omit<TrackListViewProps, 'tracks' | 'reorderable' | 'onReorder'> & {
  track: Track;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TrackItem
      track={track}
      onSelect={onSelect}
      onDelete={onDelete}
      onAddToQueue={onAddToQueue}
      onPlayNext={onPlayNext}
      onAddToPlaylist={onAddToPlaylist}
      onEdit={onEdit}
      dragHandleProps={{ ...attributes, ...listeners }}
      setNodeRef={setNodeRef}
      style={style}
      isDragging={isDragging}
    />
  );
}

export default function TrackListView({
  tracks,
  onSelect,
  onDelete,
  onAddToQueue,
  onPlayNext,
  onAddToPlaylist,
  onEdit,
  reorderable = false,
  onReorder,
}: TrackListViewProps) {
  const [items, setItems] = useState<Track[]>(tracks);

  useEffect(() => {
    setItems(tracks);
  }, [tracks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);
    onReorder?.(newItems.map((item) => item.id));
  };

  const list = useMemo(
    () => (
      <ul className="w-full space-y-3">
        {(reorderable ? items : tracks).map((track) => (
          <TrackItem
            key={track.id}
            track={track}
            onSelect={onSelect}
            onDelete={onDelete}
            onAddToQueue={onAddToQueue}
            onPlayNext={onPlayNext}
            onAddToPlaylist={onAddToPlaylist}
            onEdit={onEdit}
          />
        ))}
      </ul>
    ),
    [
      items,
      onAddToPlaylist,
      onEdit,
      onAddToQueue,
      onDelete,
      onPlayNext,
      onSelect,
      reorderable,
      tracks,
    ],
  );

  if (!reorderable) return list;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="w-full space-y-3">
          {items.map((track) => (
            <SortableTrack
              key={track.id}
              track={track}
              onSelect={onSelect}
              onDelete={onDelete}
              onAddToQueue={onAddToQueue}
              onPlayNext={onPlayNext}
              onAddToPlaylist={onAddToPlaylist}
              onEdit={onEdit}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
