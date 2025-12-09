type ViewMode = 'songs' | 'playlists';

interface LibraryHeaderProps {
  title: string;
  hasActiveFilter: boolean;
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  onClearFilter: () => void;
  onOpenUpload: () => void;
}

export default function LibraryHeader({
  title,
  hasActiveFilter,
  viewMode,
  onViewChange,
  onClearFilter,
  onOpenUpload,
}: LibraryHeaderProps) {
  return (
    <div className="flex flex-col gap-2 mb-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        Library
      </p>
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={onClearFilter}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border border-white/60 dark:border-white/10 text-muted hover:text-textLight hover:border-accentLight/70"
            >
              Clear
            </button>
          )}
        </div>
        {!hasActiveFilter && (
          <div className="inline-flex items-center gap-2 p-1 rounded-full border border-white/60 dark:border-white/10 bg-white/70 dark:bg-backgroundDark/70 shadow-soft">
            <button
              type="button"
              onClick={() => onViewChange('songs')}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                viewMode === 'songs'
                  ? 'bg-gradient-to-r from-pastelPurple to-accentLight text-white shadow-soft'
                  : 'text-muted'
              }`}
            >
              Songs
            </button>
            <button
              type="button"
              onClick={() => onViewChange('playlists')}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                viewMode === 'playlists'
                  ? 'bg-gradient-to-r from-pastelPurple to-accentLight text-white shadow-soft'
                  : 'text-muted'
              }`}
            >
              Playlists
            </button>
          </div>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={onOpenUpload}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-gradient-to-r from-pastelPurple to-accentLight text-white font-semibold shadow-soft hover:shadow-glass"
        >
          Upload
        </button>
      </div>
    </div>
  );
}
