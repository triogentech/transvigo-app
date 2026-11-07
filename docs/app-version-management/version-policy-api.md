# Version policy API

## Public: `GET /api/app-config/version`
No auth, rate limited (120/min), `Cache-Control: public, max-age=60`, server-side policy cache 30 s.

Query: `platform=android` (required), `app=driver` (default), `versionCode=<int>` (installed code, optional).

```json
{
  "app": "driver", "platform": "android", "configured": true,
  "latestVersion": "1.2.0", "latestVersionCode": 12,
  "minimumSupportedVersion": "1.1.0", "minimumSupportedVersionCode": 10,
  "installedVersionCode": 11,
  "updateAvailable": true, "forceUpdate": false, "updateType": "optional",
  "updateMessage": "…", "releaseNotes": ["…"],
  "storeUrl": "https://play.google.com/store/apps/details?id=com.transvigo.driver",
  "maintenanceMode": false, "maintenanceMessage": null,
  "policyUpdatedAt": "2026-…Z"
}
```
Rules: `updateAvailable = installed < latest`; `forceUpdate = enforceMinimum && installed < minimum`; `updateType` = mandatory / optional / none. No `versionCode` → nothing offered or forced. Nothing configured → `configured:false`, no update, no maintenance (never blocks users). Unsupported platform/app → `400` `UNSUPPORTED_PLATFORM` / `UNSUPPORTED_APP`. Bad `versionCode` → `400`.

Example (latest 12, min 10, enforcement on): 12 → none · 11 → optional · 10 → optional · 9 → mandatory. With enforcement off, 9 is optional.

## Admin (platform auth; not reachable with tenant tokens)
- `GET /platform/app-config/versions` — Super & Support admins.
- `PUT /platform/app-config/version` — **Super Admin only** (403 otherwise). Body: `app, platform, latestVersion, latestVersionCode, minimumSupportedVersion, minimumSupportedVersionCode, enforceMinimum, updateMessage?, releaseNotes[≤10×200], storeUrl (https://play.google.com/…), maintenanceMode, maintenanceMessage?`.
  Validation: semver `X.Y.Z`; codes ≥ 1; **minimum ≤ latest** (code and version) — also enforced by a DB `CHECK`. Audited as `APP_VERSION_POLICY_UPDATED`.

## Enforcement responses (driver trip start)
`426 {"error":"APP_UPDATE_REQUIRED","code":"APP_UPDATE_REQUIRED","minimumSupportedVersion":…,"storeUrl":…}` · `503 {"code":"MAINTENANCE","message":…}`. The app reacts by re-fetching the policy immediately.

## Data
Table `app_version_policies` (migration 017), unique `(app, platform)`, RLS enabled with no policies (REST roles denied; API connects as owner). No seed row: the first policy is created from the dashboard, so **nothing changes in production until someone saves one**.
