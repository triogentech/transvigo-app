import { Linking } from 'react-native';
import { create } from 'zustand';
import { fetchVersionPolicy, type VersionPolicy } from '@/api/app-config.api';
import * as tripsApi from '@/api/trips.api';
import { useAuthStore } from '@/store/auth.store';
import { createKV } from '@/utils/kv';
import { APP_VERSION_CODE } from '@/utils/app-version';
import { checkPlayUpdate, onPlayUpdateEvent, PLAY_NONE, startPlayUpdate, type PlayInfo } from '@/utils/play-update';

const kv = createKV('transvigo-update');
const POLICY_KEY = 'policy';
const SNOOZE_KEY = 'snooze';
const LAST_CODE_KEY = 'last_code';

const MIN_INTERVAL_MS = 15 * 60 * 1000; // normal re-check throttle
const RETRY_AFTER_FAIL_MS = 2 * 60 * 1000; // back-off after a failed fetch
const SNOOZE_MS = 24 * 60 * 60 * 1000; // "Later" hides the same optional update for a day

export type UpdateMode = 'none' | 'optional' | 'mandatory' | 'maintenance';
type Phase = 'idle' | 'starting' | 'downloading' | 'cancelled' | 'failed';

interface UpdateState {
  policy: VersionPolicy | null;
  play: PlayInfo;
  phase: Phase;
  /** true = in_transit trip exists; false = none; null = unknown (check pending/failed). */
  hasActiveTrip: boolean | null;
  lastAttemptAt: number;
  lastSuccessAt: number;
  snoozedUntil: number;
  justUpdated: boolean;
  /** Set when the API itself answered 426: authoritative even if the cached policy says otherwise. */
  serverBlock: { storeUrl: string | null; minimumSupportedVersion: string | null } | null;

  hydrate: () => void;
  checkPolicy: (opts?: { force?: boolean }) => Promise<void>;
  checkPlay: () => Promise<void>;
  refreshActiveTrip: () => Promise<void>;
  startUpdate: () => Promise<void>;
  snooze: () => void;
}

function readJSON<T>(key: string): T | null {
  try {
    const raw = kv.getString(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

let unsubscribePlay: (() => void) | null = null;

export const useUpdateStore = create<UpdateState>((set, get) => ({
  policy: null,
  play: PLAY_NONE,
  phase: 'idle',
  hasActiveTrip: null,
  lastAttemptAt: 0,
  lastSuccessAt: 0,
  snoozedUntil: 0,
  justUpdated: false,
  serverBlock: null,

  hydrate: () => {
    // Last known policy keeps a mandatory update enforced while offline — but only
    // if it was evaluated for THIS installed versionCode.
    const cached = readJSON<VersionPolicy>(POLICY_KEY);
    const snooze = readJSON<{ code: number; until: number }>(SNOOZE_KEY);
    const last = Number.parseInt(kv.getString(LAST_CODE_KEY) ?? '', 10);
    const upgraded = APP_VERSION_CODE !== null && Number.isFinite(last) && last > 0 && APP_VERSION_CODE > last;
    if (APP_VERSION_CODE !== null) kv.set(LAST_CODE_KEY, String(APP_VERSION_CODE));
    set({
      policy: cached && cached.installedVersionCode === APP_VERSION_CODE ? cached : null,
      snoozedUntil: snooze && snooze.code === cached?.latestVersionCode ? snooze.until : 0,
      justUpdated: upgraded,
    });
  },

  checkPolicy: async ({ force = false } = {}) => {
    const { lastAttemptAt, lastSuccessAt } = get();
    const now = Date.now();
    const wait = lastSuccessAt >= lastAttemptAt ? MIN_INTERVAL_MS : RETRY_AFTER_FAIL_MS;
    if (!force && now - lastAttemptAt < wait) return;
    set({ lastAttemptAt: now });
    try {
      const policy = await fetchVersionPolicy(APP_VERSION_CODE);
      kv.set(POLICY_KEY, JSON.stringify(policy));
      set((st) => ({
        policy,
        lastSuccessAt: Date.now(),
        serverBlock: APP_VERSION_CODE !== null && !policy.forceUpdate ? null : st.serverBlock,
      }));
    } catch {
      // Fail open: keep the last known (cached) policy; never crash or block on a failed check.
    }
  },

  checkPlay: async () => {
    set({ play: await checkPlayUpdate() });
  },

  refreshActiveTrip: async () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated || user?.role !== 'Driver') {
      set({ hasActiveTrip: false });
      return;
    }
    try {
      const page = await tripsApi.getTripsPage({ status: 'in_transit', pageSize: 1 });
      set({ hasActiveTrip: page.trips.length > 0 });
    } catch {
      set({ hasActiveTrip: null }); // unknown => treated as "maybe on a trip": never hard-block
    }
  },

  startUpdate: async () => {
    const { policy, play } = get();
    const mode = selectMode(get());
    const openStore = async (): Promise<void> => {
      const url = policy?.storeUrl ?? get().serverBlock?.storeUrl;
      if (url) await Linking.openURL(url).catch(() => undefined);
    };
    set({ phase: 'starting' });
    unsubscribePlay?.();
    unsubscribePlay = onPlayUpdateEvent({
      started: () => set({ phase: 'downloading' }),
      downloaded: () => set({ phase: 'idle' }),
      cancelled: () => set({ phase: 'cancelled' }),
    });

    if (!play.available) {
      // Not offered by Play on this device (sideloaded APK, staged rollout, Play missing):
      // mandatory users are sent to the store listing; nothing else to do.
      await openStore();
      set({ phase: 'idle' });
      return;
    }
    const immediate = mode === 'mandatory' && play.immediateAllowed;
    if (mode === 'mandatory' && !immediate && !play.flexibleAllowed) {
      await openStore();
      set({ phase: 'idle' });
      return;
    }
    const ok = await startPlayUpdate(immediate);
    // For IMMEDIATE the app is taken over by Play's UI and restarted on success.
    set({ phase: ok ? (immediate ? 'idle' : 'downloading') : 'failed' });
  },

  snooze: () => {
    const code = get().policy?.latestVersionCode;
    const until = Date.now() + SNOOZE_MS;
    if (code) kv.set(SNOOZE_KEY, JSON.stringify({ code, until }));
    set({ snoozedUntil: until });
  },
}));

/** Decision for the UI. Server flags are authoritative; Play must confirm optional updates. */
export function selectMode(s: Pick<UpdateState, 'policy' | 'play' | 'snoozedUntil' | 'serverBlock'>): UpdateMode {
  if (s.policy?.maintenanceMode) return 'maintenance';
  if (s.serverBlock) return 'mandatory';
  const p = s.policy;
  if (!p || !p.configured) return 'none';
  if (p.maintenanceMode) return 'maintenance';
  if (p.forceUpdate) return 'mandatory';
  // Optional: only if Play actually has the update (otherwise we'd offer something uninstallable).
  if (p.updateAvailable && s.play.available && Date.now() >= s.snoozedUntil) return 'optional';
  return 'none';
}

/** Called by the HTTP client when the backend answers 426/503 (policy changed since last check). */
export function handlePolicyBlockedByServer(info?: { status: number; data?: Record<string, unknown> }): void {
  if (info?.status === 426) {
    useUpdateStore.setState({
      serverBlock: {
        storeUrl: typeof info.data?.storeUrl === 'string' ? info.data.storeUrl : null,
        minimumSupportedVersion:
          typeof info.data?.minimumSupportedVersion === 'string' ? info.data.minimumSupportedVersion : null,
      },
    });
  }
  void useUpdateStore.getState().checkPolicy({ force: true });
  // The gate/banner choice depends on whether a trip is in progress right now.
  void useUpdateStore.getState().refreshActiveTrip();
}
