import { create } from 'zustand';

export type PushStatus = 'unknown' | 'registered' | 'denied' | 'unsupported' | 'error';

interface PushState {
  status: PushStatus;
  /** Why registration failed (for support), when status is 'error'. */
  error: string | null;
  set: (status: PushStatus, error?: string | null) => void;
}

/** Whether this phone is actually registered to receive push notifications. */
export const usePushStore = create<PushState>((set) => ({
  status: 'unknown',
  error: null,
  set: (status, error = null) => set({ status, error }),
}));
