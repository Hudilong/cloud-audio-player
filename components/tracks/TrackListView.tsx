'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
import { TrackWithCover } from '@app-types/trackWithCover';
import { TrackItem } from './TrackItem';

interface TrackListViewProps {
  tracks: TrackWithCover[];
  onSelect: (track: TrackWithCover) => void | Promise<void>;
  onDelete: (track: TrackWithCover) => void;
  onAddToQueue: (track: TrackWithCover) => void;
  onPlayNext: (track: TrackWithCover) => void;
  onAddToPlaylist: (track: TrackWithCover) => void;
  onRemoveFromPlaylist?: (track: TrackWithCover) => void;
  reorderable?: boolean;
  onReorder?: (orderedTracks: TrackWithCover[]) => void;
  onEdit?: (track: TrackWithCover) => void;
  onAddToFeatured?: (track: TrackWithCover) => void;
  onRemoveFromFeatured?: (track: TrackWithCover) => void;
  featuringTrackId?: string | null;
  isAdmin?: boolean;
  currentUserId?: string | null;
}

function SortableTrack({
  track,
  onSelect,
  onDelete,
  onAddToQueue,
  onPlayNext,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  onEdit,
  onAddToFeatured,
  onRemoveFromFeatured,
  featuringTrackId,
  isAdmin,
  currentUserId,
}: Omit<TrackListViewProps, 'tracks' | 'reorderable' | 'onReorder'> & {
  track: TrackWithCover;
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
      onRemoveFromPlaylist={onRemoveFromPlaylist}
      onEdit={onEdit}
      onAddToFeatured={onAddToFeatured}
      onRemoveFromFeatured={onRemoveFromFeatured}
      featuringTrackId={featuringTrackId}
      isAdmin={isAdmin}
      currentUserId={currentUserId}
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
  onRemoveFromPlaylist,
  onEdit,
  onAddToFeatured,
  onRemoveFromFeatured,
  featuringTrackId,
  isAdmin,
  currentUserId,
  reorderable = false,
  onReorder,
}: TrackListViewProps) {
  const [items, setItems] = useState<TrackWithCover[]>(tracks);

  useEffect(() => {
    setItems((prev) => {
      const sameOrder =
        prev.length === tracks.length &&
        prev.every((item, idx) => item.id === tracks[idx]?.id);
      return sameOrder ? prev : tracks;
    });
  }, [tracks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 0,
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
    onReorder?.(newItems);
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
            onRemoveFromPlaylist={onRemoveFromPlaylist}
            onEdit={onEdit}
            onAddToFeatured={onAddToFeatured}
            onRemoveFromFeatured={onRemoveFromFeatured}
            featuringTrackId={featuringTrackId}
            isAdmin={isAdmin}
            currentUserId={currentUserId}
          />
        ))}
      </ul>
    ),
    [
      items,
      onAddToPlaylist,
      onRemoveFromPlaylist,
      onEdit,
      onAddToQueue,
      onDelete,
      onPlayNext,
      onSelect,
      reorderable,
      tracks,
      onAddToFeatured,
      onRemoveFromFeatured,
      featuringTrackId,
      isAdmin,
      currentUserId,
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
              onRemoveFromPlaylist={onRemoveFromPlaylist}
              onEdit={onEdit}
              onAddToFeatured={onAddToFeatured}
              onRemoveFromFeatured={onRemoveFromFeatured}
              featuringTrackId={featuringTrackId}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
