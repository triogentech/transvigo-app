import { create } from 'zustand';
import { createKV } from '@/utils/kv';

/** User's appearance preference. `system` follows the OS light/dark setting. */
export type ThemeMode = 'light' | 'dark' | 'system';

const kv = createKV('transvigo-settings');
const KEY = 'themeMode';

function loadMode(): ThemeMode {
  const v = kv.getString(KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

/**
 * Holds the driver's chosen appearance and persists it (MMKV in real builds;
 * in-memory in Expo Go). `useColors`/`useResolvedScheme` read this to pick the
 * palette; the Profile screen writes it.
 */
export const useThemeStore = create<ThemeState>((set) => ({
  mode: loadMode(),
  setMode: (mode) => {
    kv.set(KEY, mode);
    set({ mode });
  },
}));
