import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import type { TokenPair } from '@/types/api.types';
import { APP_VERSION_CODE } from '@/utils/app-version';

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

/** Fired when the backend rejects with 426 APP_UPDATE_REQUIRED or 503 MAINTENANCE. */
let policyBlockedHandler: ((info: { status: number; data?: Record<string, unknown> }) => void) | null = null;
export function registerPolicyBlockedHandler(
  fn: (info: { status: number; data?: Record<string, unknown> }) => void,
): void {
  policyBlockedHandler = fn;
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
  if (APP_VERSION_CODE !== null) config.headers.set('X-App-Version-Code', String(APP_VERSION_CODE));
  return config;
});

// ── Single-flight token refresh ──
let refreshPromise: Promise<boolean> | null = null;
let refreshRejected = false;

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
      .catch((err) => {
        // Only a definitive rejection (401/400/403) means the session is dead.
        // Network errors/timeouts/5xx must NOT log the driver out.
        const st = axios.isAxiosError(err) ? err.response?.status : undefined;
        refreshRejected = st === 400 || st === 401 || st === 403;
        return false;
      })
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

    const code = (error.response?.data as { code?: string } | undefined)?.code;
    if ((status === 426 && code === 'APP_UPDATE_REQUIRED') || (status === 503 && code === 'MAINTENANCE')) {
      policyBlockedHandler?.({ status: status as number, data: error.response?.data as Record<string, unknown> });
    }

    // Transparent refresh on 401 (never for the auth endpoints themselves).
    if (status === 401 && original && !original._retry && !url.includes('/auth/')) {
      original._retry = true;
      const ok = await doRefresh();
      if (ok) {
        original.headers.set('Authorization', `Bearer ${auth.accessToken}`);
        return api(original);
      }
      if (refreshRejected) handlers?.onAuthFailure();
    }
    return Promise.reject(error);
  },
);

/** Normalises a backend/axios error into a user-facing message. */
export function errMessage(err: unknown, fallback = 'Request failed'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; message?: string; code?: string } | undefined;
    // Coded errors (e.g. APP_UPDATE_REQUIRED, MAINTENANCE) carry a driver-readable `message`; `error` is the machine code.
    if (data?.code && data.message) return data.message;
    return data?.error ?? data?.message ?? err.message ?? fallback;
  }
  return fallback;
}

/** True when the failure is a network/timeout error (no HTTP response). */
export function isNetworkError(err: unknown): boolean {
  return axios.isAxiosError(err) && !err.response;
}
