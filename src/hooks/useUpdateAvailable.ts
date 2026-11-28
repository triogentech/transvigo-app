import { selectMode, useUpdateStore } from '@/store/update.store';

/**
 * Is a newer version of the app available (per the server's policy), and a way to start it. Used by the profile
 * screens so a driver can always update by hand, even after choosing "Later" on the popup.
 */
export function useUpdateAvailable(): { available: boolean; latestVersion: string | null; start: () => void } {
  const mode = useUpdateStore((s) => selectMode({ ...s, snoozedUntil: 0 })); // "Later" hides the popup, not this row
  const latestVersion = useUpdateStore((s) => s.policy?.latestVersion ?? null);
  return {
    available: mode === 'optional' || mode === 'mandatory',
    latestVersion,
    start: () => void useUpdateStore.getState().startUpdate(),
  };
}
