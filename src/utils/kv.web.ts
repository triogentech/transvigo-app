// Web variant of the KV store — localStorage-backed (no MMKV on web).
interface WebStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  readonly length: number;
  key(index: number): string | null;
}

export interface KVStore {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  getAllKeys(): string[];
}

function storage(): WebStorage | undefined {
  return (globalThis as { localStorage?: WebStorage }).localStorage;
}

export function createKV(id: string): KVStore {
  const prefix = `${id}:`;
  return {
    getString: (k) => storage()?.getItem(prefix + k) ?? undefined,
    set: (k, v) => storage()?.setItem(prefix + k, v),
    delete: (k) => storage()?.removeItem(prefix + k),
    getAllKeys: () => {
      const s = storage();
      if (!s) return [];
      const keys: string[] = [];
      for (let i = 0; i < s.length; i += 1) {
        const key = s.key(i);
        if (key && key.startsWith(prefix)) keys.push(key.slice(prefix.length));
      }
      return keys;
    },
  };
}
