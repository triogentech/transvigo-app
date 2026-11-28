import * as ImagePicker from 'expo-image-picker';
import * as tripsApi from '@/api/trips.api';
import { getCurrentCoords } from '@/utils/trip-capture';
import type { TouchingLocation, Trip } from '@/types/api.types';

export class CameraDeniedError extends Error {
  constructor() {
    super('CAMERA_DENIED');
    this.name = 'CameraDeniedError';
  }
}

/**
 * Opens the camera for the stamped trip sheet. Resolves the photo's uri, or null when the driver cancels.
 * Throws CameraDeniedError when the camera permission is refused.
 */
export async function takeStampPhoto(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) throw new CameraDeniedError();
  const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
  return !result.canceled && result.assets[0] ? result.assets[0].uri : null;
}

/**
 * Reports reaching ('in') or leaving ('out') a touching point: reads where the driver is, uploads the photo when
 * there is one, then saves the report. Time defaults to now. Lets LocationUnavailableError through, and saves
 * nothing when the location cannot be read.
 */
export async function reportTouchingPoint(args: {
  tripId: string;
  point: TouchingLocation;
  stage: 'in' | 'out';
  time?: Date;
  photoUri?: string | null;
}): Promise<Trip> {
  const coords = await getCurrentCoords();
  if (args.photoUri) await tripsApi.uploadTouchingPhoto(args.tripId, args.point.id, args.stage, args.photoUri);
  return tripsApi.reportTouching(args.tripId, args.point.id, args.stage, args.time, coords);
}
