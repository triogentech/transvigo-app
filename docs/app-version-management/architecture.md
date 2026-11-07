# App version management — architecture

## Existing state (audited before the change)
- Expo SDK 54 / RN 0.81 (new arch), package `com.transvigo.driver`, `app.json` version 1.0.0, committed `android/` project (gradle versionCode 1, overwritten at build time).
- Release path: **EAS Build** (`eas.json`: `appVersionSource: remote`, production `autoIncrement`, AAB) per `PLAY_STORE.md`; sideloaded APKs per `DISTRIBUTION.md`. No `expo-updates` / EAS Update.
- Only update logic: `useInAppUpdate` — a blind flexible Play check at launch. No version policy, no backend awareness, no release notes, no mandatory path.

## Two independent checks
| Check | Question | Source |
|---|---|---|
| Backend policy | Is the installed version still *supported*? What are the notes/message? Maintenance? | `GET /api/app-config/version` (our DB) |
| Google Play | Is a newer build actually *installable* on this device? | Play Core In-App Updates via `expo-in-app-updates` 0.12 (existing dependency; wraps `AppUpdateManager`) |

Decision (`selectMode` in `src/store/update.store.ts`): maintenance → mandatory (server `forceUpdate`) → optional (**server `updateAvailable` AND Play confirms**) → none. Optional is suppressed when Play has nothing installable (sideloaded APK, staged rollout not yet reaching the device) so drivers are never offered an update they cannot install. Mandatory is shown regardless; if Play can't do it the button opens the store listing.

## Components
```
Dashboard (God Mode ▸ Settings) --PUT--> Backend --> app_version_policies (+ platform audit log)
Driver app --GET (public, versionCode)--> Backend  --> {updateType, forceUpdate, notes, …}
Driver app --Play Core--> Google Play (immediate / flexible)
Driver app --X-App-Version-Code header--> Backend  --> 426 on trip START when below minimum
```
Backend: `src/modules/app-config/*`, migration `017_app_version_policy`. Dashboard: `pages/god/AppVersionPage.tsx`. App: `store/update.store.ts`, `components/update/UpdateGate.tsx`, `hooks/useUpdateChecks.ts`, `utils/play-update.ts`, `utils/app-version.ts`.

## Why God Mode (not the tenant dashboard)
The policy is **global** (one Play listing for every organisation). A tenant Admin changing it would alter every other customer's drivers, so it lives in the platform console (`/god/settings`), Super Admin only for writes, Support Admin read-only, Billing Admin none. Changes are written to `platform_audit_logs` (`APP_VERSION_POLICY_UPDATED`) and the row records `updated_by_email` / `updated_at`.

## Enforcement layers
1. UI gate (full-screen modal for mandatory/maintenance; no dismiss, back button disabled).
2. Start-trip button disabled client-side.
3. **Server**: `PATCH /api/driver/trips/:id/status` with `status:'in-transit'` returns `426 APP_UPDATE_REQUIRED` (or `503 MAINTENANCE`) for requests sent as `X-Client: driver-app` with `X-App-Version-Code` below the minimum; a missing code counts as 0. Completing an active trip is **never** blocked.

Limit (stated plainly): the headers are client-asserted. A hand-crafted request that omits/changes `X-Client` bypasses the version gate (test VM-27). Defeating that requires Play Integrity attestation, which is not implemented.

## Active-trip safety
Mandatory/maintenance with an in-progress trip → non-blocking banner only; full-screen gate waits until no `in_transit` trip exists. If the trip lookup fails, the state is "unknown" and the driver is *not* hard-blocked. Optional prompts never show during a trip.

## Known library limitation
`expo-in-app-updates` calls `completeUpdate()` as soon as a flexible download finishes, i.e. the app **restarts automatically** instead of asking. Mitigation: the optional prompt only appears with no active trip and warns about the restart. A custom "restart when ready" step and download-progress UI would need a small native patch (not done). The library exposes no byte-level progress, only start/downloaded/cancelled/completed events.
