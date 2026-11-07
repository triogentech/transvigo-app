# Ecosystem architecture

Verified by reading package.json, routes, schema and code in all three repos (not just READMEs).

| App | Path | Users | Stack |
|---|---|---|---|
| Backend | `transvigo-be` | all clients | Fastify 4, Prisma 5, Supabase Postgres (RLS per org), jose JWT |
| Dashboard | `transvigo-fe` | Admin / Operations / Staff (web); platform owner via `/god/*` | React 18 + Vite |
| Driver app | `driver-app` (`com.transvigo.driver`) | Drivers (`(tabs)`) and non-driver roles (`(ops)`) | Expo 54 / RN 0.81 |

No shared packages: types are duplicated per repo (`driver-app/src/types/api.types.ts` mirrors backend shapes by hand).
`../rrc-be/rrc-be` is the legacy Strapi backend, superseded by `transvigo-be`.

## Communication
Everything is REST/JSON to one backend (`https://transvigo-be.transvigo.in`). The apps never talk to each other; the DB is the integration point. Expo Push is the only backend→phone channel; email (SMTP/Resend) is backend→ops.

## Authentication
- Login: `POST /auth/login` with org slug + email/username + password (no OTP). Returns access (15m) + refresh (7d, rotated) tokens + `mustChangePwd`.
- Driver accounts are created from the dashboard (`/api/driver-credentials`), linked to a `Driver` row by `userId`.
- Every request: `Authorization` + `X-Org-Slug`. Backend `authPreHandler` checks user active, org not suspended, forced password change; `permissionGuard` applies the role×module CRUD matrix (Admin bypass).
- Tenancy: Postgres RLS via `withOrgContext`, but the pooled role bypasses RLS and `/api/pages/*`, `/api/driver/*` filter by `orgId` in code.
- Driver scope: trips visible if `driverId` = self or vehicle currently assigned to the driver.

## Trip lifecycle (as implemented)
1. **Create/assign** — dashboard `POST /api/trips` (driver + vehicle on the trip). Status `created`; trip number from SQL `generate_trip_number`.
2. **Notify driver** — **not implemented**. `TRIP_ASSIGNED` is handled in the app's tap router but no backend code sends it. Driver sees the trip only by opening/refreshing Trips.
3. **Accept** — no accept/reject step exists in the product.
4. **Start / Complete** — `PUT /api/trips/:id/status` `{status:'created'|'in-transit'|'completed'}`; cascades vehicle (`assigned/in_transit/idle`) and driver (`assigned/in_transit/available`) status, sets `actualEndTime` on complete.
5. **During trip** — fuel (`/api/fuel-logs`), toll (`/api/toll-logs`), tickets (`/api/tickets`) with email to Admin/Staff/Operations; tickets are round-robin auto-assigned to ops and push the assignee.
6. **Ops monitoring** — dashboard pages (`/api/pages/trips`, dashboard, analytics) read the same tables. No live driver location exists anywhere (no location table/endpoint).

## Notifications
Push token stored on `User.pushToken` (`PATCH /api/driver/push-token`). Backend sends push only for ticket/job-card **assignment** (`notifyAssignment`) and ticket status/SLA flows; none for trip assignment/changes. Driver app has an in-app notifications screen (`/api/notifications`).
