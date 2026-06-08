import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as InAppUpdates from 'expo-in-app-updates';

/**
 * On Android, checks Google Play for a newer published version on app launch and
 * starts a **flexible** in-app update (downloads in the background, then prompts
 * the user to restart). No-op on iOS and on non-Play-Store installs (dev client,
 * sideloaded APK) — those throw and are swallowed.
 *
 * Requires the app to be installed from the Play Store (internal testing track or
 * production) for the flow to actually appear.
 */
export function useInAppUpdate(): void {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    // false = flexible update; pass true for an immediate (blocking) update.
    InAppUpdates.checkAndStartUpdate(false).catch(() => {
      // Not a Play Store install or no update available — ignore.
    });
  }, []);
}
