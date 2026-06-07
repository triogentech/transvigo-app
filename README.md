# TransVigo Driver App

A React Native (Expo) mobile app for fleet drivers. Drivers sign in, see their
active trip, advance trip status, raise and track maintenance/incident tickets,
and log fuel and toll expenses — with offline support so work captured in poor
connectivity syncs automatically once back online.

It is the mobile client for the **TransVigo backend** (`../transvigo-be`).

---

## Tech stack

| Area | Choice |
|------|--------|
| Framework | [Expo](https://expo.dev) SDK 54 · React Native 0.81 · React 19 |
| Architecture | **New Architecture** (TurboModules/Fabric) + Hermes — required by `react-native-mmkv` 3 |
| Routing | [Expo Router](https://docs.expo.dev/router/introduction/) v6 (file-based) |
| Language | TypeScript (strict), path alias `@/*` → `src/*` |
| State | [Zustand](https://github.com/pmndrs/zustand) stores |
| HTTP | Axios with a shared client (auth + refresh interceptors) |
| Secure storage | `expo-secure-store` (Keychain / Keystore) — tokens only |
| Fast KV storage | `react-native-mmkv` (cache + offline queue); `localStorage` on web |
| Connectivity | `@react-native-community/netinfo` |
| Push | `expo-notifications` |

---

## Prerequisites

- **Node** ≥ 20 (developed on v24)
- **Expo CLI** via `npx expo` (no global install needed)
- A running **TransVigo backend** reachable from the device/emulator
- For Android: Android Studio + an emulator or a USB device
- For iOS: Xcode + a simulator (macOS only)

> **Expo Go is not enough.** This app uses native modules (MMKV, secure-store,
> camera, location) and the New Architecture, so you must build a **dev client**
> with `expo run:android` / `expo run:ios`. Remote push also requires a dev or
> standalone build.

---

## Setup

```bash
cd driver-app
npm install
cp .env.example .env   # then edit EXPO_PUBLIC_API_URL
```

### Environment variables (`.env`)

| Variable | Default | Notes |
|----------|---------|-------|
| `EXPO_PUBLIC_API_URL` | `http://localhost:3007` | Backend base URL. **On a physical device, `localhost` won't reach your machine** — use your LAN IP, e.g. `http://192.168.1.20:3007`. |
| `EXPO_PUBLIC_APP_ENV` | `development` | Free-form environment label. |

`EXPO_PUBLIC_*` vars are inlined into the bundle at build time — restart the
bundler after changing them.

---

## Running

```bash
npm run android   # build + install the dev client on Android, start Metro
npm run ios       # build + install on iOS simulator, start Metro
npm start         # start Metro only (against an already-installed dev client)
npm run web       # run in the browser (MMKV falls back to localStorage)
npm run typecheck # tsc --noEmit
```

First native build takes a few minutes; subsequent `npm start` launches are fast.

---

## Project structure

```
driver-app/
├── app/                      # Expo Router routes (file = screen)
│   ├── _layout.tsx           # Root: providers, auth gate, offline banner, toaster
│   ├── (auth)/               # Unauthenticated group
│   │   ├── login.tsx
│   │   └── change-password.tsx   # also reachable while signed in (from Profile)
│   ├── (tabs)/               # Authenticated tab bar
│   │   ├── index.tsx         # Home (greeting, active trip, quick actions, alerts)
│   │   ├── trips.tsx
│   │   ├── tickets.tsx
│   │   └── profile.tsx
│   ├── trip/[id].tsx         # Trip detail + status transitions
│   ├── ticket/[id].tsx       # Ticket detail + SLA + history
│   ├── ticket/new.tsx        # Raise a ticket (offline-capable)
│   ├── fuel/log.tsx          # Log fuel (offline-capable)
│   └── toll/log.tsx          # Log toll (offline-capable)
│
└── src/
    ├── api/                  # One module per backend resource + shared client.ts
    ├── components/           # ui/ (primitives) + home/ trip/ ticket/ (feature blocks)
    ├── hooks/                # useActiveTrip, useTrips, useTickets, useOffline, …
    ├── store/                # Zustand: auth, offline, trip, toast
    ├── theme/                # colors (brand + light/dark), typography, spacing
    ├── types/api.types.ts    # Mirror of backend JSON shapes
    └── utils/                # cache, offline-queue, kv, token-storage, jwt, sla, format
```

See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for how auth, offline sync,
caching, and notifications fit together.

---

## Key behaviours at a glance

- **Auth gate** (`app/_layout.tsx`) redirects between `(auth)` and `(tabs)` based
  on store state. On launch, `initAuth()` loads tokens from secure storage and
  refreshes them if the access token is expired.
- **Transparent token refresh** — a 401 triggers a single-flight refresh and
  retries the original request; a failed refresh logs the user out.
- **Offline-first writes** — raising a ticket / logging fuel / logging toll while
  offline enqueues the request (FIFO, MMKV-backed) and replays it automatically
  when connectivity returns. 4xx responses are dropped (won't retry); transient
  failures retry up to 3 times.
- **Stale-while-revalidate reads** — lists and the active trip paint instantly
  from a TTL cache, then refresh in the background; stale cache is the offline
  fallback.
- **SLA tracking** — ticket deadlines mirror the backend windows (critical 4h,
  high 8h, medium 24h, low 72h) and drive countdowns, at-risk/breached badges,
  and Home alerts.

---

## Backend dependency note

The composite driver endpoints `/api/driver/me` and `/api/driver/home` are
delivered in **backend stage D12** and will return 404 until that ships. The app
degrades gracefully (Home and Profile stay usable with reduced data). Endpoints
under `/api/tickets`, `/api/pages/trips`, `/api/fuel-logs`, `/api/toll-logs`,
`/api/service-schedules`, `/api/select/*`, and `/auth/*` are already available.

---

## Troubleshooting

**`react-native-mmkv 3.x requires TurboModules, but the new architecture is not
enabled`** — your installed binary was built before the New Architecture was
enabled. The config is already correct (`android/gradle.properties` →
`newArchEnabled=true`); you just need a clean native rebuild:

```bash
rm -rf android/app/build android/app/.cxx android/build android/.gradle
npm run android
```

Do **not** downgrade MMKV to 2.x — SDK 54 ships New Architecture by default.

**`Can't reach the server at <url>`** on login — the device can't reach the
backend. Confirm the backend is running and set `EXPO_PUBLIC_API_URL` to a host
the device can resolve (LAN IP for physical devices, not `localhost`).

**Push notifications don't arrive** — remote push requires a dev/standalone
build (not Expo Go) and an `eas.projectId`. Registration is best-effort and
never blocks the app if permission is denied.
