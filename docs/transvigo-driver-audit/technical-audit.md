# Technical audit

**Architecture** is clean: expo-router groups, Zustand, one axios client, KV abstraction (MMKV/localStorage), tokens in SecureStore only. `tsc --noEmit` passes. No ESLint config, no tests, no CI.

| # | Finding | Evidence | Sev | Status |
|---|---|---|---|---|
| 1 | Trip status wire value rejected | `trips.api.ts` vs `trips.schema.ts` | P0 | fixed |
| 2 | Any refresh failure (incl. offline) logged the driver out at launch and on 401 | `client.ts doRefresh`, `auth.store initAuth` | P0 | fixed: logout only on 400/401/403 from refresh |
| 3 | Driver role lacks permission for status PUT | `default-permissions.ts` | P0 | needs decision |
| 4 | Offline queue dropped 401/408/429 as "user error" and gave up after 3 tries (silent data loss) | `offline.store.ts`, `offline-queue.ts` | P1 | fixed (transient codes retained, 6 tries) |
| 5 | No idempotency on queued POSTs | `offline-queue.ts` | P1 | backend dependency |
| 6 | Trip status changes not queued offline; ticket photos and fuel odometer photo are lost offline/never uploaded | fuel/log.tsx, ticket/new.tsx | P1 | backlog |
| 7 | Double-tap on Start/Complete could fire twice | trip/[id].tsx | P2 | fixed (`acting` guard + loading) |
| 8 | `RECORD_AUDIO` declared but unused (Play policy risk); location string mentions "Always" though only foreground is used | app.json, manifest | P2 | fixed |
| 9 | Home & Tickets tabs both show the open-ticket badge; tab badge fetched once, never refreshed | `(tabs)/_layout.tsx` | P2 | backlog |
| 10 | 1s `setInterval` per ticket row on Home | `SlaCountdown` | P2 | backlog (single shared ticker) |
| 11 | Expo packages 3 patch versions behind (`expo-doctor`) | expo-doctor | P3 | backlog; needs `npm install` |
| 12 | Local gradle release uses **debug keystore** | `android/app/build.gradle:110,115` | P0 for release | use EAS remote credentials only |
| 13 | CORS / secrets issues on backend (see earlier analysis) | backend | — | outside this scope |
