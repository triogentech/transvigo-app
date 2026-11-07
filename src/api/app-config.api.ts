import axios from 'axios';
import Constants from 'expo-constants';

/** Server-evaluated update decision for the installed versionCode. */
export interface VersionPolicy {
  configured: boolean;
  latestVersion: string | null;
  latestVersionCode: number | null;
  minimumSupportedVersion: string | null;
  minimumSupportedVersionCode: number | null;
  installedVersionCode: number | null;
  updateAvailable: boolean;
  forceUpdate: boolean;
  updateType: 'none' | 'optional' | 'mandatory';
  updateMessage: string | null;
  releaseNotes: string[];
  storeUrl: string | null;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  policyUpdatedAt: string | null;
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3007';

/** Public, unauthenticated; uses bare axios so auth/refresh interceptors never apply. */
export async function fetchVersionPolicy(versionCode: number | null): Promise<VersionPolicy> {
  const res = await axios.get<VersionPolicy>(`${BASE_URL}/api/app-config/version`, {
    params: { platform: 'android', app: 'driver', ...(versionCode ? { versionCode } : {}) },
    timeout: 10_000,
    headers: { 'X-Client': 'driver-app', 'X-App-Version': Constants.expoConfig?.version ?? '' },
  });
  return res.data;
}
