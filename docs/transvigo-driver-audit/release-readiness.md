# Release readiness — NOT ready to build/ship yet

| Item | State |
|---|---|
| Package `com.transvigo.driver` | preserved |
| Version name | 1.1.0 (set) |
| versionCode | `eas.json` uses `appVersionSource: remote` + `autoIncrement`, so EAS increments from its stored value. Local `build.gradle` still says 1 — **verify against the Play Console's current code**; never build the .aab locally |
| Signing | local gradle release is signed with the **debug keystore** — must build via `eas build -p android --profile production` so the existing upload key is used. Not verified |
| Permissions | CAMERA, FINE/COARSE location, POST_NOTIFICATIONS, VIBRATE, RECEIVE_BOOT_COMPLETED; RECORD_AUDIO removed. Re-check the Play data-safety form |
| API URL | production profile uses `https://transvigo-be.transvigo.in`; no secrets in app |
| Build | not run; **no .aab produced** |
| Dependencies | 3 Expo patch updates pending |

## Blockers
1. **Resolved (option A implemented, needs deploy):** new `PATCH /api/driver/trips/:id/status` in transvigo-be. **Deploy the backend BEFORE releasing app 1.1.0** (the app now calls it). Original issue: how should drivers be allowed to Start/Complete trips? Today `Driver` has read-only `trips`, so the status `PUT` returns 403 even with the fixed payload, unless your production roles were manually edited. Recommended: new driver-scoped endpoint that checks the trip belongs to the driver, rather than granting `trips:update`.
2. On-device regression pass (see testing-report).
3. Confirm versionCode and signing, then build with EAS. Upload only after your explicit approval.
