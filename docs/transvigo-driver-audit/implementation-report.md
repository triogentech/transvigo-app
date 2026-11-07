# Implementation report

Mobile-only changes. Backend and dashboard untouched; app ID `com.transvigo.driver` and API contracts preserved.

| File | Change | Why |
|---|---|---|
| `src/api/trips.api.ts` | send `in-transit` on the wire | backend `tripStatusSchema` rejects `in_transit` (400) |
| `src/api/client.ts` | refresh failure triggers logout only if server returns 400/401/403 | offline/5xx no longer ends the session |
| `src/store/auth.store.ts` | launch-time refresh follows the same rule | offline cold start keeps the driver signed in |
| `src/store/offline.store.ts` | 401/408/429 are retryable, not dropped | avoids silent loss of queued logs |
| `src/utils/offline-queue.ts` | max retries 3 → 6 | survives flaky connectivity |
| `app/trip/[id].tsx` | pull-to-refresh, in-flight guard + loading state on Start/Complete, "Navigate to Pickup/Drop" (Google Maps URL from existing address text) | stale data, double taps, no navigation |
| `app.json`, `AndroidManifest.xml` | removed `RECORD_AUDIO` (+`recordAudioAndroid:false`), added foreground-only location string, version 1.0.0 → 1.1.0 | least privilege, Play review |

Not implemented (needs decision/backend): driver trip-status permission (see below), trip-assignment push, idempotency keys, offline trip-status queue, photo queue, Home "next assigned trip", live location.
Deliberately not done: no mock data, no new dependencies, no backend edits.

## Backend change (option A)
`transvigo-be`: `PATCH /api/driver/trips/:id/status` (`driver.routes.ts`, `driver.service.ts#driverUpdateTripStatus`, `driver.schema.ts`). Body `{status:'in-transit'|'completed', actualEndTime?}`. Checks the trip is the driver's own or on their assigned vehicle (403 otherwise), forward-only (409 on skips/backwards), same-state repeat returns the trip unchanged (retry-safe). Reuses `updateTripStatus`, so vehicle/driver status cascades are identical. No `trips:update` grant. Tests: `tests/driver-trip-status.test.ts` (4). App `trips.api.ts` now calls this endpoint.
