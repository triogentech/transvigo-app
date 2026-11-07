# Testing report — app version management

**Environment:** throwaway local stack, NOT production, NOT staging. Postgres 15 (Homebrew) on `127.0.0.1:55432` with all 18 repo migrations applied; `transvigo-be` on `localhost:3007`; local SMTP sink. The only production contact was one read-only query (schema names + row counts) that confirmed the production DB lacks migrations 017/018 and the new endpoint (`GET /api/app-config/version` on production returned 404).

**Not tested on Android.** An emulator/Gradle build was abandoned (disk full; stalled build; then asked not to use Android Studio). The app was exercised as its **real JS bundle in headless Chrome (Expo web)** — real UI, real HTTP to the real backend, real DB checks — but web has no Play Core and no real `versionCode`.

## Results
| Layer | Tests | Pass | Fail | Notes |
|---|---|---|---|---|
| Backend unit (policy matrix, validation) | 13 | 13 | 0 | `tests/app-config.test.ts` |
| Backend HTTP against real Postgres | 30 | 30 | 0 | `vm-e2e.mjs`: public API, auth/RBAC, validation, enforcement, audit |
| Driver app in browser (UI → API → DB) | 20 | 20 | 0 | `web-e2e.mjs` — final run on the rebuilt bundle after all fixes: 20/20 (adds W-06 logged-out startup, W-07 signed-in startup, W-08 button colour) |
| Type-check: backend, driver app | 2 | 2 | 0 | dashboard: 4 pre-existing errors, none in new files |
| Dashboard page | 0 | – | – | builds only; **page not exercised in a browser (NOT TESTED)** |

### Backend (HTTP, real DB) — all PASS
VM-01 unconfigured = safe no-op · VM-02/03/04 unsupported platform/app, bad versionCode → 400 · VM-05 PUT without token 401 · VM-06 min>latest 400 · VM-07 non-Play URL 400 · VM-08 Support admin PUT 403 · VM-09 Support admin GET 200 · VM-10 bad token 401 · VM-11 save records `updated_by` · VM-12..15 latest 12/min 10: 12 none, 11 optional, 10 optional, 9 optional when enforcement OFF · VM-16 no versionCode → nothing offered · VM-17/18 enforcement ON: 9 mandatory, 10 optional · VM-19..20 org + driver login · VM-21 outdated client cannot START trip (426) · VM-22 missing version header cannot START (426) · VM-23 blocked start persisted nothing · VM-24 supported client starts · VM-25 outdated client **can complete** its active trip · VM-26 next trip blocked after policy raise · VM-27 **known limitation**: a client that omits `X-Client` bypasses the gate (headers are client-asserted) · VM-28 maintenance blocks START (503) · VM-29 disabling enforcement lets old client start · VM-30 changes in platform audit log (`APP_VERSION_POLICY_UPDATED`).

### Driver app in headless Chrome — all PASS
W-01 no policy → no gate · W-02 version API unreachable → app loads (fails open) · W-03a/b/c maintenance gate shows server message, not dismissable, clears after policy off + "Try again" · W-04a UI login · W-04b trip detail (+Navigate) · W-04c real 426 on Start → full-screen "Update required" · W-04d versions/reason/release notes shown · W-04e no Later/Close, Escape inert · W-04f blocked start persisted nothing · W-05a..f active trip → banner (no block), Start disabled, **Complete still works (DB: completed + end time)**, then the full-screen gate takes over. Screenshots: `/tmp/transvigo-qa/shots/`.

## NOT TESTED (cannot be, here)
| Item | Why |
|---|---|
| Google Play flexible/immediate update, download, cancel, failure, restart, "installed version verified" | needs a Play internal-test track + an older installed build on a device |
| Optional-update sheet ("Update now / Later", 24 h snooze) | requires Play to report an available update; on web it correctly never appears |
| Real `versionCode` read from the binary (`expo-application`) | web returns none |
| Release notes/message from a policy change on a real device (#17 in the brief) | web covers the API→UI path only |
| Dashboard "App Version Management" page in a browser | not driven; only compiled |
| Network-unavailable on a device, Play Store missing | partially covered by W-02 (API unreachable) only |
| Sideloaded-APK fleet behaviour (DISTRIBUTION.md) | design: mandatory opens the store listing; optional suppressed |
| Concurrent policy edits by two admins | last write wins; no optimistic locking |

## Defects found and fixed during testing
1. **Trip numbers broke for org slugs containing "-"** (second trip of the day → 500). Fixed in migration 018; verified.
2. Update gate didn't learn when a trip ended / didn't re-check trip state after a 426. Fixed; verified (W-05f).
3. A 426 for a client that can't read its versionCode showed nothing. Fixed (426 itself now drives the mandatory screen).
4. Error toast showed the raw code `APP_UPDATE_REQUIRED`; now shows the server's readable message. Update-screen icon was invisible in dark mode. Both fixed (visual check after re-export).

## Open findings (not fixed)
| Sev | Finding |
|---|---|
| P1 | Production needs migrations 017 + 018 deployed **before** app 1.1.0 ships (app calls new endpoints). |
| P2 | Server-side gate trusts client headers (`X-Client`, `X-App-Version-Code`); a custom client can bypass it. Needs Play Integrity to close. |
| P2 | Flexible updates auto-restart the app when the download completes (library calls `completeUpdate()` itself); no progress UI. Mitigated by showing the optional prompt only when no trip is active. |
| P3 | `drivers` has `UNIQUE(org_id, ifsc_code)`: two drivers of the same bank branch cannot be created (schema decision, not changed). |
| P3 | Version policy response is browser/CDN cacheable for 60 s (+30 s server cache): policy changes take ~1.5 min to reach clients. |
| P3 | Web preview only: `expo-notifications` throws on web; bundle needs `type=module` (import.meta). Native unaffected. |

## Verdict
Server logic and the driver UI states are verified end-to-end against a real database. **The Play Store integration itself is unverified** and the dashboard page has not been exercised in a browser. Do not call this production-ready until: migrations are deployed, a Play internal-track upgrade test is done on a real device, and the dashboard page is clicked through.


**Final run (after all fixes):** 17/17 browser tests pass; screenshots confirm the readable error toast and the visible dark-mode icon. One earlier run failed only because my harness exhausted the platform-login rate limiter (restart cleared it); that is a test-setup artifact, not an app result.

## Follow-up small fixes (all verified)
| Fix | Verification |
|---|---|
| Org creation no longer 500s / loses the temp password when the welcome email fails (`emailSent:false` + dashboard warning) | SF-07..09 real HTTP with SMTP down: 201, password returned, admin can log in, org committed |
| Trip assignment push (`TRIP_ASSIGNED`) on create and on driver change only | SF-02..06 real HTTP with outbound pushes recorded (not sent to Expo) + 3 unit tests |
| App waits for auth to load before sending requests and fails locally when signed out; Ops Hub no longer fetches for Drivers | W-06 (0 requests logged out), W-07 (no 401/403 on signed-in start) — this also removed a real cold-start race where a signed-in driver's first fetches went out without a token |
| Secondary/ghost buttons use the teal accent in dark mode | W-08 computed colour + screenshot |
| Stale RBAC unit test updated (Drivers have read-only vehicles by design) | backend suite 27/27 |

Still NOT tested: native Android behaviour of the auth-ready change (verified on web only); real Expo push delivery to a device.
