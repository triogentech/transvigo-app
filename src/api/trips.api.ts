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
  awaitingClosure?: AwaitingClosure | null;
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

/** Closing also sends when the trip closed (defaults to now). */
export interface CloseExtras { actualEndTime?: string }

/** Driver actions: created → in_transit (start), in_transit → completed.
 *  Uses the driver-scoped endpoint (ownership + forward-only checked server-side;
 *  repeating the same transition is a safe no-op). Wire values are hyphenated.
 *  Newer app builds send the odometer + GPS capture (the photo is uploaded first). */
export async function updateTripStatus(id: string, status: TripStatus, capture?: TripCapture, extras?: CloseExtras): Promise<Trip> {
  const wire = status === 'in_transit' ? 'in-transit' : status;
  const res = await api.patch<Trip>(`/api/driver/trips/${id}/status`, { status: wire, ...capture, ...extras });
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

// ── Driver-created trips, touching points, attachments ──

export interface NewTripBody {
  tripNumber: string;
  dispatchTime: string; // ISO
  startPoint: string;
  endPoint: string;
  tatHours: number;
  startOdometer: number;
  vehicleId?: string;
}

/** The driver creates a trip after leaving: it runs at once and waits for the office to approve it.
 *  Sending the same trip number again (a retry) returns the same trip. */
export async function createDriverTrip(body: NewTripBody): Promise<Trip> {
  const res = await api.post<Trip>('/api/driver/trips', body);
  return res.data;
}

/** Reaching ('in') or leaving ('out') a touching point the office added to the trip. */
export async function reportTouching(tripId: string, pointId: string, stage: 'in' | 'out', time?: Date, coords?: { latitude: number; longitude: number }): Promise<Trip> {
  const res = await api.post<Trip>(`/api/driver/trips/${tripId}/touching/${pointId}`, { stage, time: time?.toISOString(), ...coords });
  return res.data;
}

/** The photo of the stamped trip sheet at a touching point (for reaching or leaving). Upload it before the report. */
export async function uploadTouchingPhoto(tripId: string, pointId: string, stage: 'in' | 'out', uri: string): Promise<string> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    form.append('file', await (await fetch(uri)).blob(), `sheet-${stage}.jpg`);
  } else {
    form.append('file', { uri, name: `sheet-${stage}.jpg`, type: 'image/jpeg' } as unknown as Blob);
  }
  const res = await api.post<{ url: string }>(`/api/driver/trips/${tripId}/touching/${pointId}/photo`, form, {
    params: { stage },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.url;
}

export type AttachmentKind = 'start_odometer' | 'trip_sheet' | 'arrival_report';

/** Uploads a photo for the trip: the start odometer, the trip sheet, or the arrival report. */
export async function uploadAttachment(id: string, kind: AttachmentKind, uri: string): Promise<string> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    form.append('file', await (await fetch(uri)).blob(), `${kind}.jpg`);
  } else {
    form.append('file', { uri, name: `${kind}.jpg`, type: 'image/jpeg' } as unknown as Blob);
  }
  const res = await api.post<{ url: string }>(`/api/driver/trips/${id}/attachment`, form, {
    params: { kind },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.url;
}

/** A closed trip the office has not approved yet, or sent back (shown on the Trips tab). */
export interface AwaitingClosure {
  id: string;
  tripNumber: string;
  startPoint: string;
  endPoint: string;
  closeApproval: 'pending' | 'needs_changes';
  approvalNote: string | null;
  haltMinutes: number;
  delayMinutes: number;
}
