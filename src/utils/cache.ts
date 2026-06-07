import { createKV } from './kv';

/**
 * Fast local read-cache. Native uses MMKV; web falls back to localStorage
 * (see kv.web.ts). Every successful GET can be cached so the UI shows
 * last-known data instantly (offline / cold start) while fresh data loads.
 */
const storage = createKV('transvigo-cache');

interface Envelope<T> {
  data: T;
  expiresAt: number;
}

export const CACHE_TTL = {
  list: 5 * 60 * 1000,
  detail: 2 * 60 * 1000,
} as const;

export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  const envelope: Envelope<T> = { data, expiresAt: Date.now() + ttlMs };
  storage.set(key, JSON.stringify(envelope));
}

/** Returns cached data if present and unexpired; otherwise null (and evicts). */
export function cacheGet<T>(key: string): T | null {
  const raw = storage.getString(key);
  if (!raw) return null;
  try {
    const envelope = JSON.parse(raw) as Envelope<T>;
    if (envelope.expiresAt < Date.now()) {
      storage.delete(key);
      return null;
    }
    return envelope.data;
  } catch {
    storage.delete(key);
    return null;
  }
}

/** Returns cached data ignoring TTL — useful as an offline fallback. */
export function cacheGetStale<T>(key: string): T | null {
  const raw = storage.getString(key);
  if (!raw) return null;
  try {
    return (JSON.parse(raw) as Envelope<T>).data;
  } catch {
    return null;
  }
}

export function cacheInvalidate(prefix: string): void {
  for (const key of storage.getAllKeys()) {
    if (key.startsWith(prefix)) storage.delete(key);
  }
}

export function cacheKey(endpoint: string, params?: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) return endpoint;
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${String(params[k])}`)
    .join('&');
  return `${endpoint}?${sorted}`;
}
