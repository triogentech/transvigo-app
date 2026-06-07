import { useEffect } from 'react';
import { initOfflineListener, useOfflineStore } from '@/store/offline.store';

/**
 * Connectivity + sync status. Ensures the NetInfo listener is running
 * (guarded — safe to call from multiple components; lives for the app's life).
 */
export function useOffline() {
  const isOnline = useOfflineStore((s) => s.isOnline);
  const queuedCount = useOfflineStore((s) => s.queuedCount);
  const isSyncing = useOfflineStore((s) => s.isSyncing);
  const syncQueue = useOfflineStore((s) => s.syncQueue);

  useEffect(() => {
    initOfflineListener();
  }, []);

  return { isOnline, queuedCount, isSyncing, syncQueue };
}
