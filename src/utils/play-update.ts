import { Platform } from 'react-native';

/**
 * Thin, crash-proof wrapper over Google Play In-App Updates
 * (`expo-in-app-updates`, which wraps Play Core's AppUpdateManager).
 * The native module is absent in Expo Go / web / non-Play installs, so it is
 * lazy-required and every call degrades to "no update" instead of throwing.
 */
type Mod = typeof import('expo-in-app-updates');

function mod(): Mod | null {
  if (Platform.OS !== 'android') return null;
  try {
    return require('expo-in-app-updates') as Mod;
  } catch {
    return null;
  }
}

export interface PlayInfo {
  available: boolean;
  immediateAllowed: boolean;
  flexibleAllowed: boolean;
  /** Version code Play reports as newest (string), when available. */
  storeVersion: string | null;
}
export const PLAY_NONE: PlayInfo = { available: false, immediateAllowed: false, flexibleAllowed: false, storeVersion: null };

export async function checkPlayUpdate(): Promise<PlayInfo> {
  const m = mod();
  if (!m) return PLAY_NONE;
  try {
    const r = await m.checkForUpdate();
    return {
      available: Boolean(r.updateAvailable),
      immediateAllowed: Boolean(r.immediateAllowed),
      flexibleAllowed: Boolean(r.flexibleAllowed),
      storeVersion: r.storeVersion ?? null,
    };
  } catch {
    return PLAY_NONE; // Play Store missing / not a Play install / throttled
  }
}

/** Resolves true if Play accepted the request. */
export async function startPlayUpdate(immediate: boolean): Promise<boolean> {
  const m = mod();
  if (!m) return false;
  try {
    return Boolean(await m.startUpdate(immediate));
  } catch {
    return false;
  }
}

export function onPlayUpdateEvent(
  handlers: { started?: () => void; downloaded?: () => void; cancelled?: () => void; completed?: () => void },
): () => void {
  const m = mod();
  if (!m) return () => undefined;
  const offs: Array<() => void> = [];
  try {
    if (handlers.started) offs.push(m.addUpdateListener('updateStart', handlers.started));
    if (handlers.downloaded) offs.push(m.addUpdateListener('updateDownloaded', handlers.downloaded));
    if (handlers.cancelled) offs.push(m.addUpdateListener('updateCancelled', handlers.cancelled));
    if (handlers.completed) offs.push(m.addUpdateListener('updateCompleted', handlers.completed));
  } catch {
    /* listeners unsupported */
  }
  return () => offs.forEach((off) => off());
}
