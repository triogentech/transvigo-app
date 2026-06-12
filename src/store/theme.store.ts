import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createKV } from '@/utils/kv';

/** User's appearance preference. `system` follows the OS light/dark setting. */
export type ThemeMode = 'light' | 'dark' | 'system';

const kv = createKV('transvigo-settings');
const KEY = 'themeMode';

function isMode(v: unknown): v is ThemeMode {
  return v === 'light' || v === 'dark' || v === 'system';
}

/** Synchronous initial read — instant in real builds where MMKV is available. */
function loadMode(): ThemeMode {
  const v = kv.getString(KEY);
  return isMode(v) ? v : 'system';
}

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** Async durable read; rehydrates the saved choice on app start. */
  hydrate: () => Promise<void>;
}

/**
 * Holds the chosen appearance and persists it durably across restarts.
 *
 * Two layers so it survives every runtime:
 *  • MMKV — synchronous, used for the instant initial paint in real builds.
 *  • AsyncStorage — works everywhere (incl. Expo Go, where MMKV degrades to a
 *    non-persistent in-memory store), so the choice is never lost.
 * Both are written on every change; `hydrate()` reconciles them on launch.
 * `useColors`/`useResolvedScheme` read `mode`; the Profile screens write it.
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: loadMode(),
  setMode: (mode) => {
    kv.set(KEY, mode);
    void AsyncStorage.setItem(KEY, mode); // durable; persists even without MMKV
    set({ mode });
  },
  hydrate: async () => {
    try {
      const v = await AsyncStorage.getItem(KEY);
      if (isMode(v)) {
        kv.set(KEY, v); // keep the sync layer in sync for next launch
        if (v !== get().mode) set({ mode: v });
      } else if (get().mode !== 'system') {
        // First run after upgrade: mirror an MMKV-only value into AsyncStorage.
        void AsyncStorage.setItem(KEY, get().mode);
      }
    } catch {
      /* storage unavailable — keep the in-memory default */
    }
  },
}));

// Rehydrate the saved appearance once, as early as the store is first imported.
void useThemeStore.getState().hydrate();
