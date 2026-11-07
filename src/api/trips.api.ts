import { api } from './client';
import type {
  FuelLog,
  Transaction,
  Trip,
  TripStatus,
} from '@/types/api.types';

export interface TripsPage {
  trips: Trip[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface TripDetail {
  trip: Trip;
  transactions?: Transaction[];
  fuelLogs?: FuelLog[];
}

export interface TripsParams {
  page?: number;
  pageSize?: number;
  status?: TripStatus;
}

export async function getTripsPage(params: TripsParams): Promise<TripsPage> {
  const res = await api.get<TripsPage>('/api/pages/trips', { params });
  return res.data;
}

export async function getTripDetail(id: string): Promise<TripDetail> {
  // The backend may return the trip directly (with nested includes) or wrapped
  // as { trip, ... }. Normalise both shapes.
  const res = await api.get<Record<string, unknown>>(`/api/pages/trips/${id}`);
  const d = res.data;
  const trip = (d.trip ?? d) as Trip;
  const transactions = ((d.transactions ?? trip.transactions) ?? []) as Transaction[];
  const fuelLogs = ((d.fuelLogs ?? trip.fuelLogs) ?? []) as FuelLog[];
  return { trip, transactions, fuelLogs };
}

/** Driver actions: created → in_transit (start), in_transit → completed.
 *  Uses the driver-scoped endpoint (ownership + forward-only checked server-side;
 *  repeating the same transition is a safe no-op). Wire values are hyphenated. */
export async function updateTripStatus(id: string, status: TripStatus): Promise<Trip> {
  const wire = status === 'in_transit' ? 'in-transit' : status;
  const res = await api.patch<Trip>(`/api/driver/trips/${id}/status`, { status: wire });
  return res.data;
}
