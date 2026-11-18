import { useEffect, useState } from 'react';
import type { Trip } from '@/types/api.types';

/** Minutes allocated to the trip: the planned duration, else estimated end - estimated start. */
export function allocatedMinutes(trip: Trip): number {
  if (trip.totalTripTimeMinutes && trip.totalTripTimeMinutes > 0) return trip.totalTripTimeMinutes;
  const ms = new Date(trip.estimatedEndTime).getTime() - new Date(trip.estimatedStartTime).getTime();
  return Math.max(0, Math.round(ms / 60_000));
}

/** Minutes left of the allocation since the driver started (negative = overtime); null before start. */
export function remainingMinutes(trip: Trip, now: Date = new Date()): number | null {
  if (trip.currentStatus !== 'in_transit' || !trip.actualStartTime) return null;
  const elapsed = (now.getTime() - new Date(trip.actualStartTime).getTime()) / 60_000;
  return Math.round(allocatedMinutes(trip) - elapsed);
}

/** "6h 20m" / "45m" (absolute value). */
export function formatDuration(minutes: number): string {
  const m = Math.abs(Math.round(minutes));
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
}

/** Re-renders every 30 s so countdowns stay current. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}
