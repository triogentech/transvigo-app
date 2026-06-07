import { create } from 'zustand';
import * as authApi from '@/api/auth.api';
import { clearClientAuth, registerAuthHandlers, setClientAuth } from '@/api/client';
import * as tokenStorage from '@/utils/token-storage';
import { isExpired } from '@/utils/jwt';
import type { AuthUser, ChangePasswordBody, LoginRequest, TokenPair } from '@/types/api.types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  orgSlug: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // true during the launch token check

  login: (body: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
  initAuth: () => Promise<void>;
  changePassword: (body: ChangePasswordBody) => Promise<void>;
}

/** Persist a refreshed token pair everywhere (SecureStore + axios + store). */
async function persistPair(pair: TokenPair): Promise<void> {
  const orgSlug = useAuthStore.getState().orgSlug ?? '';
  await tokenStorage.saveTokens(pair.accessToken, pair.refreshToken, orgSlug);
  setClientAuth({ accessToken: pair.accessToken, refreshToken: pair.refreshToken });
  useAuthStore.setState({
    accessToken: pair.accessToken,
    refreshToken: pair.refreshToken,
    isAuthenticated: true,
  });
}

let handlersRegistered = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  orgSlug: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (body) => {
    const res = await authApi.login(body);
    const user: AuthUser = {
      id: res.user.id,
      email: res.user.email,
      username: res.user.username,
      role: res.user.role,
      mustChangePwd: res.user.mustChangePwd,
    };
    await tokenStorage.saveTokens(res.accessToken, res.refreshToken, res.orgSlug);
    await tokenStorage.saveUser(user);
    setClientAuth({ accessToken: res.accessToken, refreshToken: res.refreshToken, orgSlug: res.orgSlug });
    set({
      user,
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      orgSlug: res.orgSlug,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // best-effort; clear locally regardless
    }
    await tokenStorage.clearTokens();
    clearClientAuth();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      orgSlug: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  refreshTokens: async () => {
    const rt = get().refreshToken;
    if (!rt) return false;
    try {
      const pair = await authApi.refresh(rt);
      await persistPair(pair);
      return true;
    } catch {
      return false;
    }
  },

  initAuth: async () => {
    if (!handlersRegistered) {
      registerAuthHandlers({
        onTokensRefreshed: (pair) => {
          void persistPair(pair);
        },
        onAuthFailure: () => {
          void get().logout();
        },
      });
      handlersRegistered = true;
    }

    const [access, refresh, orgSlug, user] = await Promise.all([
      tokenStorage.getAccessToken(),
      tokenStorage.getRefreshToken(),
      tokenStorage.getOrgSlug(),
      tokenStorage.getUser(),
    ]);

    if (!access || !refresh) {
      set({ isAuthenticated: false, isLoading: false });
      return;
    }

    setClientAuth({ accessToken: access, refreshToken: refresh, orgSlug });
    set({ user, accessToken: access, refreshToken: refresh, orgSlug });

    if (isExpired(access)) {
      const ok = await get().refreshTokens();
      if (!ok) {
        await get().logout();
        return;
      }
    }
    set({ isAuthenticated: true, isLoading: false });
  },

  changePassword: async (body) => {
    await authApi.changePassword(body);
    set((s) => (s.user ? { user: { ...s.user, mustChangePwd: false } } : {}));
  },
}));
