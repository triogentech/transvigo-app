import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as tripsApi from '@/api/trips.api';
import { errMessage } from '@/api/client';
import { useTripStore } from '@/store/trip.store';
import { showToast } from '@/store/toast.store';
import { cacheGetStale, cacheSet, CACHE_TTL } from '@/utils/cache';
import type { Trip, TripStatus } from '@/types/api.types';

const CACHE_KEY = 'active_trip';

/** The driver's current in_transit trip. Cached for instant display, polled
 *  every 60s while the app is foregrounded. */
export function useActiveTrip() {
  const activeTrip = useTripStore((s) => s.activeTrip);
  const setActiveTrip = useTripStore((s) => s.setActiveTrip);
  const [loading, setLoading] = useState(activeTrip === null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const page = await tripsApi.getTripsPage({ status: 'in_transit', pageSize: 1 });
      const trip = page.trips[0] ?? null;
      setActiveTrip(trip);
      cacheSet(CACHE_KEY, trip, CACHE_TTL.detail);
      setError(null);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, [setActiveTrip]);

  // Instant paint from cache, then fetch fresh.
  useEffect(() => {
    if (!activeTrip) {
      const cached = cacheGetStale<Trip | null>(CACHE_KEY);
      if (cached) setActiveTrip(cached);
    }
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll while foregrounded.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = (): void => {
      if (!timer) timer = setInterval(() => void refresh(), 60_000);
    };
    const stop = (): void => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    start();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refresh();
        start();
      } else {
        stop();
      }
    });
    return () => {
      stop();
      sub.remove();
    };
  }, [refresh]);

  const updateStatus = useCallback(
    async (status: TripStatus): Promise<void> => {
      const current = useTripStore.getState().activeTrip;
      if (!current) return;
      try {
        const updated = await tripsApi.updateTripStatus(current.id, status);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (status === 'completed') {
          setActiveTrip(null);
          cacheSet(CACHE_KEY, null, CACHE_TTL.detail);
        } else {
          setActiveTrip(updated);
          cacheSet(CACHE_KEY, updated, CACHE_TTL.detail);
        }
        await refresh();
      } catch (e) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast({ type: 'error', message: errMessage(e, 'Could not update trip') });
        throw e;
      }
    },
    [setActiveTrip, refresh],
  );

  return { activeTrip, loading, error, refresh, updateStatus };
}
