// Web variant: localStorage instead of expo-secure-store (which has no web
// support). NOTE: this is NOT secure storage — it exists only so the app can
// boot for browser previews. Real builds (Android) use token-storage.ts.
import type { AuthUser } from '@/types/api.types';

interface WebStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const KEYS = {
  access: 'transvigo_access_token',
  refresh: 'transvigo_refresh_token',
  orgSlug: 'transvigo_org_slug',
  user: 'transvigo_user',
} as const;

function ls(): WebStorage | undefined {
  return (globalThis as { localStorage?: WebStorage }).localStorage;
}

export async function saveTokens(access: string, refresh: string, orgSlug: string): Promise<void> {
  const s = ls();
  if (!s) return;
  s.setItem(KEYS.access, access);
  s.setItem(KEYS.refresh, refresh);
  s.setItem(KEYS.orgSlug, orgSlug);
}

export async function getAccessToken(): Promise<string | null> {
  return ls()?.getItem(KEYS.access) ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  return ls()?.getItem(KEYS.refresh) ?? null;
}

export async function getOrgSlug(): Promise<string | null> {
  return ls()?.getItem(KEYS.orgSlug) ?? null;
}

export async function setAccessToken(access: string): Promise<void> {
  ls()?.setItem(KEYS.access, access);
}

export async function clearTokens(): Promise<void> {
  const s = ls();
  if (!s) return;
  s.removeItem(KEYS.access);
  s.removeItem(KEYS.refresh);
  s.removeItem(KEYS.orgSlug);
  s.removeItem(KEYS.user);
}

export async function saveUser(user: AuthUser): Promise<void> {
  ls()?.setItem(KEYS.user, JSON.stringify(user));
}

export async function getUser(): Promise<AuthUser | null> {
  const raw = ls()?.getItem(KEYS.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
