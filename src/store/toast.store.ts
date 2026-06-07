import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastState {
  toasts: ToastItem[];
  show: (type: ToastType, message: string) => void;
  dismiss: (id: string) => void;
}

let seq = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (type, message) => {
    seq += 1;
    const id = `toast_${seq}`;
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative helper for use outside React (hooks, stores, interceptors). */
export function showToast(t: { type: ToastType; message: string }): void {
  useToastStore.getState().show(t.type, t.message);
}
