import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '@/types/api.types';

/**
 * Secure persistence for auth material. expo-secure-store is backed by the
 * Android Keystore / iOS Keychain — used for ALL tokens (never AsyncStorage).
 */
const KEYS = {
  access: 'transvigo_access_token',
  refresh: 'transvigo_refresh_token',
  orgSlug: 'transvigo_org_slug',
  user: 'transvigo_user',
} as const;

export async function saveTokens(access: string, refresh: string, orgSlug: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.access, access),
    SecureStore.setItemAsync(KEYS.refresh, refresh),
    SecureStore.setItemAsync(KEYS.orgSlug, orgSlug),
  ]);
}

export function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.access);
}

export function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.refresh);
}

export function getOrgSlug(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.orgSlug);
}

export async function setAccessToken(access: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.access, access);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.access),
    SecureStore.deleteItemAsync(KEYS.refresh),
    SecureStore.deleteItemAsync(KEYS.orgSlug),
    SecureStore.deleteItemAsync(KEYS.user),
  ]);
}

export async function saveUser(user: AuthUser): Promise<void> {
  await SecureStore.setItemAsync(KEYS.user, JSON.stringify(user));
}

export async function getUser(): Promise<AuthUser | null> {
  const raw = await SecureStore.getItemAsync(KEYS.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
