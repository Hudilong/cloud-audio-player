'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import CoverImage from '@components/ui/CoverImage';
import { LibraryTrack } from '@app-types/libraryTrack';
import { formatTime } from '@utils/formatTime';

const orderTracks = (tracks: LibraryTrack[]) =>
  [...tracks].sort(
    (a, b) => (Number(a.order || 0) || 0) - (Number(b.order || 0) || 0),
  );

export default function FeaturedAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tracks, setTracks] = useState<LibraryTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const isAdmin = session?.user?.role === 'ADMIN';

  const fetchFeatured = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/default-tracks');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load featured tracks.');
      }
      const normalized: LibraryTrack[] = (data.tracks || []).map(
        (track: LibraryTrack) => ({
          ...track,
          kind: 'featured',
          isFeatured: true,
        }),
      );
      setTracks(orderTracks(normalized));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load featured tracks.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && isAdmin) {
      fetchFeatured();
    }
  }, [fetchFeatured, isAdmin, status]);

  const moveTrack = async (id: string, direction: 'up' | 'down') => {
    const ordered = orderTracks(tracks);
    const index = ordered.findIndex((track) => track.id === id);
    if (index === -1) return;
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= ordered.length) return;

    const reordered = [...ordered];
    [reordered[index], reordered[swapIndex]] = [
      reordered[swapIndex],
      reordered[index],
    ];

    const withOrder = reordered.map((track, idx) => ({
      ...track,
      order: (idx + 1) * 100,
    }));
    setTracks(withOrder);

    setSavingOrder(true);
    try {
      await fetch('/api/default-tracks/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: withOrder.map((track) => track.id) }),
      });
    } catch {
      setError('Failed to persist ordering. Try again.');
      setTracks(orderTracks(tracks));
    } finally {
      setSavingOrder(false);
    }
  };

  const handleRemove = async (trackId: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/default-tracks/${trackId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove track from featured.');
      }
      setTracks((prev) => prev.filter((track) => track.id !== trackId));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to remove track from featured.',
      );
    }
  };

  const sortedTracks = useMemo(() => orderTracks(tracks), [tracks]);

  if (status === 'loading') {
    return (
      <div className="w-full pt-[4.5rem] sm:pt-10 px-4 sm:px-6 lg:px-8 pb-12 max-w-6xl mx-auto">
        <p className="text-muted">Loading session...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="w-full pt-[4.5rem] sm:pt-10 px-4 sm:px-6 lg:px-8 pb-12 max-w-4xl mx-auto">
        <div className="rounded-2xl border border-borderLight dark:border-borderDark bg-panelLightAlt dark:bg-panelDark p-6 shadow-soft">
          <p className="text-lg font-semibold text-ink dark:text-textDark">
            Admin access required
          </p>
          <p className="text-sm text-muted mt-2">
            You need an admin account to manage featured tracks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pt-[4.5rem] sm:pt-10 px-4 sm:px-6 lg:px-8 pb-12 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Admin
        </p>
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <h1 className="text-3xl font-bold">Featured tracks</h1>
            <p className="text-sm text-muted">
              Reorder or remove tracks from the Featured playlist. Use the
              Library menu to add new featured tracks.
            </p>
          </div>
          {savingOrder && (
            <span className="text-xs text-muted">Saving order...</span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-borderLight dark:border-borderDark bg-panelLightAlt dark:bg-panelDark shadow-soft divide-y divide-borderLight dark:divide-borderDark">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          <span className="text-sm text-muted">
            {loading ? 'Loading tracks...' : `${sortedTracks.length} track(s)`}
          </span>
        </div>
        <div className="divide-y divide-borderLight dark:divide-borderDark">
          {sortedTracks.length === 0 && !loading ? (
            <div className="p-6 text-center text-muted text-sm">
              No featured tracks yet. Use the Library menu to add tracks.
            </div>
          ) : (
            sortedTracks.map((track, index) => (
              <div
                key={track.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 px-4 sm:px-6 py-4"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <CoverImage
                    track={track}
                    width={56}
                    height={56}
                    alt={track.title || 'Cover'}
                    className="rounded-xl w-12 h-12 object-cover border border-white/70 dark:border-white/10 shadow-soft flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink dark:text-textDark truncate">
                      {track.title || 'Untitled'}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {track.artist || 'Unknown artist'}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {formatTime(track.duration)}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-accentLight/15 text-accentLight">
                    Featured
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => moveTrack(track.id, 'up')}
                    disabled={index === 0 || savingOrder}
                    className="px-3 py-1.5 text-xs rounded-full border border-borderLight dark:border-borderDark text-muted hover:text-ink dark:hover:text-textDark disabled:opacity-50"
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveTrack(track.id, 'down')}
                    disabled={index === sortedTracks.length - 1 || savingOrder}
                    className="px-3 py-1.5 text-xs rounded-full border border-borderLight dark:border-borderDark text-muted hover:text-ink dark:hover:text-textDark disabled:opacity-50"
                  >
                    Move down
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(track.id)}
                    className="px-3 py-1.5 text-xs rounded-full border border-red-200 bg-red-50 text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
