import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { useAuthStore } from '@/store/auth.store';
import { registerPolicyBlockedHandler } from '@/api/client';
import { handlePolicyBlockedByServer, selectMode, useUpdateStore } from '@/store/update.store';

const PERIODIC_MS = 30 * 60 * 1000;

/**
 * Drives the two independent checks:
 *   1. backend policy (is this installed version still supported?)  — throttled in the store
 *   2. Google Play (is a newer build actually installable here?)
 * Triggers: launch, login, return to foreground, every 30 min while open, and
 * whenever the API answers 426/503. Mount once in the root shell.
 */
export function useUpdateChecks(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    const s = useUpdateStore.getState();
    s.hydrate();
    registerPolicyBlockedHandler(handlePolicyBlockedByServer);
    void s.checkPolicy({ force: true });
    if (Platform.OS === 'android') void s.checkPlay();
  }, []);

  // After sign-in/out: re-evaluate and learn whether a trip is in progress.
  useEffect(() => {
    if (isLoading) return;
    const s = useUpdateStore.getState();
    void s.checkPolicy({ force: isAuthenticated });
    void s.refreshActiveTrip();
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    const refresh = (): void => {
      const s = useUpdateStore.getState();
      void s.checkPolicy();
      if (Platform.OS === 'android') void s.checkPlay();
      // Re-check the trip state only when it matters, to avoid extra requests.
      if (selectMode(s) !== 'none') void s.refreshActiveTrip();
    };
    const sub = AppState.addEventListener('change', (st) => st === 'active' && refresh());
    const timer = setInterval(refresh, PERIODIC_MS);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, []);
}
