import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * On Android, checks Google Play for a newer published version on app launch and
 * starts a **flexible** in-app update (downloads in the background, then prompts
 * the user to restart).
 *
 * The native module (`expo-in-app-updates`) only exists in a development/Play Store
 * build — not in Expo Go — so it is **lazy-required inside a try/catch**. A plain
 * top-level import would throw "Cannot find native module" and crash the app graph
 * in Expo Go. Here it just no-ops.
 */
export function useInAppUpdate(): void {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    try {
      const InAppUpdates = require('expo-in-app-updates') as typeof import('expo-in-app-updates');
      // false = flexible update; pass true for an immediate (blocking) update.
      void InAppUpdates.checkAndStartUpdate(false).catch(() => {
        // No update available or not a Play Store install — ignore.
      });
    } catch {
      // Native module unavailable (e.g. Expo Go) — ignore.
    }
  }, []);
}
