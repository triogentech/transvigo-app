import { Platform } from 'react-native';
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

export interface TripCapture {
  odometer: number;
  latitude: number;
  longitude: number;
}

/** Driver actions: created → in_transit (start), in_transit → completed.
 *  Uses the driver-scoped endpoint (ownership + forward-only checked server-side;
 *  repeating the same transition is a safe no-op). Wire values are hyphenated.
 *  Newer app builds send the odometer + GPS capture (the photo is uploaded first). */
export async function updateTripStatus(id: string, status: TripStatus, capture?: TripCapture): Promise<Trip> {
  const wire = status === 'in_transit' ? 'in-transit' : status;
  const res = await api.patch<Trip>(`/api/driver/trips/${id}/status`, { status: wire, ...capture });
  return res.data;
}

export type CaptureStage = 'start' | 'end';

/** Uploads the odometer photo for the start (trip not started) or end (in transit) reading. */
export async function uploadOdometerPhoto(id: string, stage: CaptureStage, uri: string): Promise<string> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    // react-native-web can't send a {uri} file part; fetch the blob (browser preview only).
    form.append('file', await (await fetch(uri)).blob(), 'odometer.jpg');
  } else {
    form.append('file', { uri, name: 'odometer.jpg', type: 'image/jpeg' } as unknown as Blob);
  }
  const res = await api.post<{ photoUrl: string }>(`/api/driver/trips/${id}/odometer-photo`, form, {
    params: { stage },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.photoUrl;
}

/** Tells the back office this driver's location is off/denied and the trip is blocked. */
export async function reportLocationDenied(id: string, stage: CaptureStage): Promise<void> {
  await api.post(`/api/driver/trips/${id}/location-denied`, { stage });
}
