# Architecture

How the TransVigo Driver app is wired together: routing, authentication,
networking, offline sync, caching, notifications, and state. Read the
[README](../README.md) first for setup and the file map.

---

## App bootstrap

`app/_layout.tsx` is the root. On mount it:

1. Calls `useAuthStore.initAuth()` — registers the axios auth handlers, loads
   tokens/user from secure storage, and refreshes the access token if expired.
2. Calls `initOfflineListener()` — subscribes to connectivity changes and drains
   the offline queue on every offline→online transition.

The shell renders providers (`GestureHandlerRootView`, `SafeAreaProvider`), a
global `<OfflineBanner>`, the router `<Stack>`, a `<Toaster>`, and a
`<LoadingOverlay>` shown while `isLoading` is true (the launch token check).

`useNotifications()` is mounted once here to register for push and route on taps.

---

## Routing & the auth gate

File-based routing (Expo Router v6). Two route groups:

- `(auth)` — `login`, `change-password`
- `(tabs)` — `index` (Home), `trips`, `tickets`, `profile`

Plus stack screens pushed over the tabs: `trip/[id]`, `ticket/[id]`,
`ticket/new`, `fuel/log`, `toll/log`.

`useAuthGate()` (in the root layout) watches `isAuthenticated` and the current
segments:

- Not authenticated and outside `(auth)` → redirect to `/(auth)/login`.
- Authenticated and inside `(auth)` → redirect to `/(tabs)` — **except**
  `change-password`, which stays reachable while signed in (opened from Profile,
  or forced after first login).

The login screen routes explicitly after success (`mustChangePwd` →
`change-password`, otherwise `/(tabs)`) to beat the gate's effect timing.

The Tabs layout fetches the open-ticket count to render a badge on the Home and
Tickets tabs.

---

## Authentication

### Token lifecycle

```
login() ──► backend returns { accessToken, refreshToken, orgSlug, user }
   │
   ├─► SecureStore.saveTokens()        (persistent, Keychain/Keystore)
   ├─► setClientAuth()                  (in-memory, read by axios interceptor)
   └─► useAuthStore.setState()          (drives the UI)
```

Three places hold auth state, each for a reason:

| Holder | Purpose |
|--------|---------|
| `expo-secure-store` (`utils/token-storage.ts`) | Durable backup across launches. **Only place tokens are persisted** — never AsyncStorage. |
| In-memory `ClientAuth` (`api/client.ts`) | The axios request interceptor reads tokens **synchronously**; SecureStore is async and can't be awaited there. |
| `useAuthStore` (Zustand) | Source of truth for rendering. |

`persistPair()` keeps all three in sync whenever tokens change.

### Launch (`initAuth`)

Loads access/refresh/orgSlug/user from SecureStore. If either token is missing →
unauthenticated. If the access token `isExpired()` (decoded locally via
`utils/jwt.ts`, 30s skew) → attempt a refresh; if that fails → log out.

### Transparent refresh (`api/client.ts`)

The response interceptor catches `401` on non-`/auth/` requests, runs a
**single-flight** refresh (concurrent 401s share one `refreshPromise`), retries
the original request once with the new token, and on refresh failure invokes
`onAuthFailure` → store logout. The refresh call uses bare axios so it isn't
itself intercepted.

### Request headers

Every request carries: `Authorization: Bearer <token>`, `X-Org-Slug`,
`X-Client: driver-app`, `X-App-Version`.

---

## Networking layer

`src/api/` has one module per resource (`auth`, `driver`, `trips`, `tickets`,
`fuel-logs`, `toll-logs`), all built on the shared `api` axios instance in
`client.ts`. Helpers `errMessage()` and `isNetworkError()` normalise failures
for the UI.

Notable endpoints:

| Module | Endpoint(s) |
|--------|-------------|
| auth | `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/change-password` |
| trips | `GET /api/pages/trips`, `GET /api/pages/trips/:id`, `PUT /api/trips/:id/status` |
| tickets | `GET/POST /api/tickets`, `GET /api/tickets/:id` |
| fuel-logs | `GET/POST /api/fuel-logs` |
| toll-logs | `POST /api/toll-logs` |
| driver | `GET /api/driver/me`, `/api/driver/home`, `PATCH /api/driver/push-token`, `GET /api/service-schedules`, `GET /api/select/:entity` |

`getTripDetail` defensively normalises both the wrapped (`{ trip, … }`) and bare
trip response shapes.

> `/api/driver/*` (composite `me`/`home`) lands in backend stage **D12** and 404s
> until then; callers swallow that and show reduced data.

---

## Storage tiers

```
expo-secure-store ── tokens, user           (encrypted, durable)
MMKV ─────────────── cache + offline queue   (fast, native)  →  localStorage on web
```

`utils/kv.ts` exposes a tiny `KVStore` interface over MMKV; `utils/kv.web.ts` is
the web variant backed by `localStorage` (resolved automatically via the
`.web.ts` platform extension). Both `cache.ts` and `offline-queue.ts` build on
`createKV()`, so they work on every platform without branching.

---

## Offline sync

Captured in `store/offline.store.ts` + `utils/offline-queue.ts`.

```
Mutation while offline ──► addToQueue()  (FIFO list in MMKV)
        │
NetInfo: offline → online ──► syncQueue() ──► processQueue(executeAction)
        │
   per action result:
     ok            → remove
     client_error  → remove   (4xx — retrying won't help)
     retryable     → retryCount++  (drop after 3, toast the failure)
```

- The queue is replayed **strictly in order**, no parallel dispatch.
- `executeAction` classifies failures: 4xx → `client_error`, everything else →
  `retryable`.
- Successful drains show a "Synced N pending actions" toast.

Which screens enqueue: `ticket/new`, `fuel/log`, `toll/log` — they detect a
network error on submit (`isNetworkError`) and fall back to `addToQueue`,
telling the user the action will sync later.

---

## Caching (stale-while-revalidate)

`utils/cache.ts` stores TTL-stamped envelopes in MMKV.

- TTLs: lists 5 min (`CACHE_TTL.list`), details 2 min (`CACHE_TTL.detail`).
- `cacheGet` returns unexpired data (and evicts on expiry); `cacheGetStale`
  ignores TTL — used as the **offline fallback** when a fetch fails.
- `cacheKey(endpoint, params)` builds a stable, sorted key.

The list hooks (`useTrips`, `useTickets`) paint cached data immediately, then
fetch fresh and re-cache; on fetch error they fall back to stale cache before
surfacing an error. `useActiveTrip` does the same for the single active trip and
**polls every 60s while foregrounded** (pausing in the background via
`AppState`).

---

## Notifications

`utils/notifications.ts` + `hooks/useNotifications.ts`:

- Foreground handler shows banner + list entry + sound.
- Android channels: `tickets` (high), `trips` (default), `alerts` (high).
- After authentication, the Expo push token is registered with the backend
  (`PATCH /api/driver/push-token`). Best-effort — never throws or blocks the app.
- `routeForNotification(data)` deep-links on tap (foreground, background, and
  cold-start): `TICKET_*` → `/ticket/:id`, `TRIP_ASSIGNED` → `/trip/:id`,
  `SERVICE_DUE` → Profile.

---

## SLA model

`utils/sla.ts` mirrors the backend's SLA windows exactly:

| Priority | Window |
|----------|--------|
| critical | 4h |
| high | 8h |
| medium | 24h |
| low | 72h |

It derives the deadline from `openedAt`, computes status
(`on_track` / `at_risk` (≤25% left) / `breached` / `resolved_on_time` /
`resolved_late`), an elapsed fraction for progress bars, and a human countdown
("18h 24m remaining" / "OVERDUE by 2h 15m"). Home (`app/(tabs)/index.tsx`) uses
this to build the alerts panel; ticket detail uses it for the SLA timer.

---

## State management

Four small Zustand stores, each single-purpose:

| Store | Holds |
|-------|-------|
| `auth.store` | user, tokens, auth status; login/logout/refresh/initAuth/changePassword |
| `offline.store` | online flag, queued count, syncing flag; the NetInfo listener |
| `trip.store` | the shared active trip (Home ↔ Trip detail) |
| `toast.store` | transient toasts; `showToast()` is callable outside React |

Component-local data fetching lives in hooks (`useTrips`, `useTickets`,
`useActiveTrip`, …) rather than in global stores, keeping the stores lean.

---

## Theme

`src/theme/` exports the brand palette (navy `#1B2D6B`, teal, green), semantic
status colors, light/dark color sets (`useColors()` picks per system scheme),
typography, and spacing scales. UI primitives in `components/ui/` consume these
so screens stay declarative.
