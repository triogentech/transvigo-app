import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { api } from '@/api/client';
import {
  getQueueCount,
  processQueue,
  type ExecResult,
  type QueuedAction,
} from '@/utils/offline-queue';
import { showToast } from './toast.store';

interface OfflineState {
  isOnline: boolean;
  queuedCount: number;
  isSyncing: boolean;
  refreshCount: () => void;
  syncQueue: () => Promise<void>;
}

async function executeAction(action: QueuedAction): Promise<ExecResult> {
  try {
    await api.request({ url: action.endpoint, method: action.method, data: action.body });
    return 'ok';
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      const s = err.response.status;
      if (s >= 400 && s < 500) return 'client_error'; // user error — don't retry
    }
    return 'retryable';
  }
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOnline: true,
  queuedCount: getQueueCount(),
  isSyncing: false,

  refreshCount: () => set({ queuedCount: getQueueCount() }),

  syncQueue: async () => {
    if (get().isSyncing || getQueueCount() === 0) return;
    set({ isSyncing: true });
    try {
      const done = await processQueue(executeAction, (a) => {
        showToast({ type: 'error', message: `Couldn't sync ${a.method} ${a.endpoint} after retries` });
      });
      if (done > 0) {
        showToast({ type: 'success', message: `Synced ${done} pending ${done === 1 ? 'action' : 'actions'}` });
      }
    } finally {
      set({ isSyncing: false, queuedCount: getQueueCount() });
    }
  },
}));

let subscribed = false;

/** Start listening for connectivity changes. Returns an unsubscribe fn.
 *  Call once from the root layout. Drains the queue on offline→online. */
export function initOfflineListener(): () => void {
  if (subscribed) return () => undefined;
  subscribed = true;
  return NetInfo.addEventListener((state) => {
    const online = Boolean(state.isConnected) && state.isInternetReachable !== false;
    const was = useOfflineStore.getState().isOnline;
    useOfflineStore.setState({ isOnline: online });
    if (online && !was) void useOfflineStore.getState().syncQueue();
  });
}
