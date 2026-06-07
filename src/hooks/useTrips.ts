import { useCallback, useEffect, useState } from 'react';
import * as tripsApi from '@/api/trips.api';
import { errMessage } from '@/api/client';
import { showToast } from '@/store/toast.store';
import { cacheGet, cacheGetStale, cacheKey, cacheSet, CACHE_TTL } from '@/utils/cache';
import type { Trip, TripStatus } from '@/types/api.types';

export type TripFilter = TripStatus | 'all';
const PAGE_SIZE = 15;

/** Page-based list (the backend paginates by page/pageSize, not cursor). */
export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilterState] = useState<TripFilter>('all');

  const buildParams = useCallback(
    (p: number): tripsApi.TripsParams => ({
      page: p,
      pageSize: PAGE_SIZE,
      ...(filter !== 'all' ? { status: filter } : {}),
    }),
    [filter],
  );

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    const key = cacheKey('trips', { p: 1, filter });
    const cached = cacheGet<tripsApi.TripsPage>(key);
    if (cached) {
      setTrips(cached.trips);
      setHasMore(cached.meta.page < cached.meta.totalPages);
      setLoading(false);
    }
    try {
      const data = await tripsApi.getTripsPage(buildParams(1));
      setTrips(data.trips);
      setPage(1);
      setHasMore(data.meta.page < data.meta.totalPages);
      cacheSet(key, data, CACHE_TTL.list);
    } catch (e) {
      const stale = cacheGetStale<tripsApi.TripsPage>(key);
      if (stale) setTrips(stale.trips);
      else setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, [buildParams, filter]);

  const fetchMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const data = await tripsApi.getTripsPage(buildParams(next));
      setTrips((prev) => [...prev, ...data.trips]);
      setPage(next);
      setHasMore(data.meta.page < data.meta.totalPages);
    } catch (e) {
      showToast({ type: 'error', message: errMessage(e) });
    } finally {
      setLoadingMore(false);
    }
  }, [buildParams, hasMore, loadingMore, page]);

  const setFilter = useCallback((f: TripFilter) => setFilterState(f), []);

  useEffect(() => {
    void fetchInitial();
  }, [fetchInitial]);

  return { trips, hasMore, loading, loadingMore, error, filter, fetchMore, setFilter, refresh: fetchInitial };
}
