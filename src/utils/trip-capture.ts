import * as Location from 'expo-location';

export type LocationIssue = 'denied' | 'disabled' | 'unavailable';

export class LocationUnavailableError extends Error {
  constructor(readonly reason: LocationIssue) {
    super(`Location ${reason}`);
  }
}

const FIX_TIMEOUT_MS = 20_000;

/** Current GPS position, or a LocationUnavailableError saying why not. */
export async function getCurrentCoords(): Promise<{ latitude: number; longitude: number }> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) throw new LocationUnavailableError('denied');
  if (!(await Location.hasServicesEnabledAsync())) throw new LocationUnavailableError('disabled');
  try {
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), FIX_TIMEOUT_MS)),
    ]);
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    throw new LocationUnavailableError('unavailable');
  }
}
