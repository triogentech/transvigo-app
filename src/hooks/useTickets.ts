import { useCallback, useEffect, useState } from 'react';
import * as ticketsApi from '@/api/tickets.api';
import { errMessage } from '@/api/client';
import { showToast } from '@/store/toast.store';
import { cacheGet, cacheGetStale, cacheKey, cacheSet, CACHE_TTL } from '@/utils/cache';
import type { Paginated, Ticket, TicketStatus } from '@/types/api.types';

export type TicketFilter = TicketStatus | 'all';
const PAGE_SIZE = 15;

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilterState] = useState<TicketFilter>('all');
  const [openCount, setOpenCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);

  const hasMore = page < pageCount;

  const buildParams = useCallback(
    (p: number): ticketsApi.TicketsParams => ({
      page: p,
      pageSize: PAGE_SIZE,
      ...(filter !== 'all' ? { status: filter } : {}),
    }),
    [filter],
  );

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    const key = cacheKey('tickets', { p: 1, filter });
    const cached = cacheGet<Paginated<Ticket>>(key);
    if (cached) {
      setTickets(cached.data);
      setPage(cached.pagination.page);
      setPageCount(cached.pagination.pageCount);
      setLoading(false);
    }
    try {
      const data = await ticketsApi.getTicketsPage(buildParams(1));
      setTickets(data.data);
      setPage(1);
      setPageCount(data.pagination.pageCount);
      cacheSet(key, data, CACHE_TTL.list);
    } catch (e) {
      const stale = cacheGetStale<Paginated<Ticket>>(key);
      if (stale) setTickets(stale.data);
      else setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, [buildParams, filter]);

  const fetchMore = useCallback(async () => {
    if (loadingMore || page >= pageCount) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const data = await ticketsApi.getTicketsPage(buildParams(next));
      setTickets((prev) => [...prev, ...data.data]);
      setPage(next);
      setPageCount(data.pagination.pageCount);
    } catch (e) {
      showToast({ type: 'error', message: errMessage(e) });
    } finally {
      setLoadingMore(false);
    }
  }, [buildParams, loadingMore, page, pageCount]);

  /** Tab-badge counts: open tickets, and open+critical tickets. */
  const refreshCounts = useCallback(async () => {
    try {
      const [open, critical] = await Promise.all([
        ticketsApi.getTicketsPage({ status: 'open', pageSize: 1 }),
        ticketsApi.getTicketsPage({ status: 'open', priority: 'critical', pageSize: 1 }),
      ]);
      setOpenCount(open.pagination.total);
      setCriticalCount(critical.pagination.total);
    } catch {
      // counts are best-effort; ignore failures
    }
  }, []);

  const setFilter = useCallback((f: TicketFilter) => setFilterState(f), []);

  useEffect(() => {
    void fetchInitial();
  }, [fetchInitial]);

  return {
    tickets,
    hasMore,
    loading,
    loadingMore,
    error,
    filter,
    openCount,
    criticalCount,
    fetchMore,
    setFilter,
    refreshCounts,
    refresh: fetchInitial,
  };
}
