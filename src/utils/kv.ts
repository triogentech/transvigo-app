/** Minimal synchronous key-value store interface (native = MMKV, web = localStorage). */
export interface KVStore {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  getAllKeys(): string[];
}

/**
 * In-memory fallback for runtimes that don't ship the MMKV native module —
 * notably **Expo Go**. The app stays functional (auth uses SecureStore, which Expo
 * Go supports); only the local read-cache and offline queue become non-persistent
 * across reloads. Use a development/production build for persistent MMKV storage.
 */
function createMemoryKV(): KVStore {
  const store = new Map<string, string>();
  return {
    getString: (k) => store.get(k),
    set: (k, v) => {
      store.set(k, v);
    },
    delete: (k) => {
      store.delete(k);
    },
    getAllKeys: () => Array.from(store.keys()),
  };
}

let warnedNoMMKV = false;

export function createKV(id: string): KVStore {
  try {
    // Lazy require so a missing/incompatible native module degrades gracefully
    // instead of crashing the whole module graph at import time (which also broke
    // expo-router's route default-export detection).
    const { MMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
    const mmkv = new MMKV({ id });
    return {
      getString: (k) => mmkv.getString(k),
      set: (k, v) => mmkv.set(k, v),
      delete: (k) => mmkv.delete(k),
      getAllKeys: () => mmkv.getAllKeys(),
    };
  } catch {
    if (!warnedNoMMKV) {
      warnedNoMMKV = true;
      // eslint-disable-next-line no-console
      console.warn(
        '[kv] react-native-mmkv unavailable (running in Expo Go?). ' +
          'Falling back to a non-persistent in-memory store. ' +
          'Use a development build (expo run:android / EAS dev profile) for persistent storage.',
      );
    }
    return createMemoryKV();
  }
}
