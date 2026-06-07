import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import type { TokenPair } from '@/types/api.types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3007';
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

/**
 * In-memory auth state. Axios reads this SYNCHRONOUSLY in the request
 * interceptor (SecureStore is async and can't be awaited there). The auth
 * store is the source of truth and keeps this in sync via setClientAuth();
 * SecureStore is the persistent backup, loaded into here on app launch.
 */
interface ClientAuth {
  accessToken: string | null;
  refreshToken: string | null;
  orgSlug: string | null;
}
const auth: ClientAuth = { accessToken: null, refreshToken: null, orgSlug: null };

export function setClientAuth(next: Partial<ClientAuth>): void {
  Object.assign(auth, next);
}
export function clearClientAuth(): void {
  auth.accessToken = null;
  auth.refreshToken = null;
  auth.orgSlug = null;
}

/** Callbacks registered by the auth store so the client can persist refreshed
 *  tokens and trigger logout — set once on app launch (avoids an import cycle). */
interface AuthHandlers {
  onTokensRefreshed: (pair: TokenPair) => void;
  onAuthFailure: () => void;
}
let handlers: AuthHandlers | null = null;
export function registerAuthHandlers(h: AuthHandlers): void {
  handlers = h;
}

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (auth.accessToken) config.headers.set('Authorization', `Bearer ${auth.accessToken}`);
  if (auth.orgSlug) config.headers.set('X-Org-Slug', auth.orgSlug);
  config.headers.set('X-Client', 'driver-app');
  config.headers.set('X-App-Version', APP_VERSION);
  return config;
});

// ── Single-flight token refresh ──
let refreshPromise: Promise<boolean> | null = null;

async function rawRefresh(refreshToken: string): Promise<TokenPair> {
  // Bare axios (not `api`) so the refresh call itself isn't intercepted.
  const res = await axios.post<TokenPair>(`${BASE_URL}/auth/refresh`, { refreshToken });
  return res.data;
}

function doRefresh(): Promise<boolean> {
  if (!auth.refreshToken) return Promise.resolve(false);
  if (!refreshPromise) {
    const token = auth.refreshToken;
    refreshPromise = rawRefresh(token)
      .then((pair) => {
        auth.accessToken = pair.accessToken;
        auth.refreshToken = pair.refreshToken;
        handlers?.onTokensRefreshed(pair);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    // Transparent refresh on 401 (never for the auth endpoints themselves).
    if (status === 401 && original && !original._retry && !url.includes('/auth/')) {
      original._retry = true;
      const ok = await doRefresh();
      if (ok) {
        original.headers.set('Authorization', `Bearer ${auth.accessToken}`);
        return api(original);
      }
      handlers?.onAuthFailure();
    }
    return Promise.reject(error);
  },
);

/** Normalises a backend/axios error into a user-facing message. */
export function errMessage(err: unknown, fallback = 'Request failed'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; message?: string } | undefined;
    return data?.error ?? data?.message ?? err.message ?? fallback;
  }
  return fallback;
}

/** True when the failure is a network/timeout error (no HTTP response). */
export function isNetworkError(err: unknown): boolean {
  return axios.isAxiosError(err) && !err.response;
}
