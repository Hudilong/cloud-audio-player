import React from 'react';
import { FiPlus } from 'react-icons/fi';
import { PlaylistWithTracks } from '../../types/playlist';
import { TrackWithCover } from '../../types/trackWithCover';
import CoverImage from '../ui/CoverImage';

interface PlaylistGridProps {
  playlists: PlaylistWithTracks[];
  onSelect: (playlistId: string) => void;
  onPlay: (playlistId: string) => void;
  onDelete: (playlistId: string) => void;
  onCreate: () => void;
}

function CreatePlaylistCard({ onCreate }: { onCreate: () => void }) {
  return (
    <button
      type="button"
      onClick={onCreate}
      className="h-full min-h-[180px] rounded-2xl border border-dashed border-borderLight/80 dark:border-borderDark/60 bg-panelLightAlt dark:bg-panelDark backdrop-blur flex flex-col items-center justify-center gap-3 text-muted hover:border-accentLight/70 hover:text-ink dark:hover:text-textDark hover:shadow-glass transition"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pastelPurple to-accentLight text-white shadow-soft">
        <FiPlus />
      </span>
      <p className="font-semibold">Create playlist</p>
    </button>
  );
}

function PlaylistCard({
  playlist,
  onSelect,
  onPlay,
  onDelete,
}: {
  playlist: PlaylistWithTracks;
  onSelect: PlaylistGridProps['onSelect'];
  onPlay: PlaylistGridProps['onPlay'];
  onDelete: PlaylistGridProps['onDelete'];
}) {
  const orderedTracks = [...playlist.playlistTracks].sort(
    (a, b) => a.position - b.position,
  );
  const firstTrack = orderedTracks[0]?.track
    ? ({
        ...orderedTracks[0].track,
        kind: orderedTracks[0].track.isFeatured ? 'featured' : 'user',
      } as TrackWithCover)
    : undefined;
  const trackCount = orderedTracks.length;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(playlist.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(playlist.id);
        }
      }}
      className="rounded-2xl border border-borderLight dark:border-borderDark bg-panelLightAlt dark:bg-panelDark backdrop-blur p-4 shadow-soft hover:shadow-glass flex flex-col gap-3 cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-xl border border-borderLight dark:border-borderDark h-32 bg-panelLightAlt dark:bg-panelDarkAlt">
        <CoverImage
          track={firstTrack}
          width={128}
          height={128}
          fill
          sizes="(min-width: 1024px) 200px, (min-width: 640px) 45vw, 90vw"
          alt={`${playlist.name} cover`}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
        <div className="absolute bottom-2 left-2 text-xs font-semibold px-3 py-1 rounded-full bg-panelLight dark:bg-panelDark text-ink dark:text-textDark">
          {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
        </div>
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-ink dark:text-textDark">
            {playlist.name}
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPlay(playlist.id);
            }}
            disabled={trackCount === 0}
            className="px-3 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-pastelPurple to-accentLight text-white shadow-soft disabled:opacity-60"
          >
            Play
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(playlist.id);
            }}
            className="px-3 py-2 rounded-full text-xs font-semibold border border-red-400/70 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

const MemoPlaylistCard = React.memo(PlaylistCard);

export default function PlaylistGrid({
  playlists,
  onSelect,
  onPlay,
  onDelete,
  onCreate,
}: PlaylistGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      <CreatePlaylistCard onCreate={onCreate} />

      {playlists.map((playlist) => (
        <MemoPlaylistCard
          key={playlist.id}
          playlist={playlist}
          onSelect={onSelect}
          onPlay={onPlay}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
