# Current feature inventory (driver-app)

| Screen | Access | API | Actions / notes |
|---|---|---|---|
| Login `(auth)/login` | launch | `POST /auth/login` | org slug + credentials; routes to change-password if `mustChangePwd`; role decides `(tabs)` vs `(ops)` |
| Change password | forced / Profile | `POST /auth/change-password` | |
| Home `(tabs)/index` | tab | `GET /api/pages/trips?status=in_transit`, `/api/tickets`, `/api/driver/me` | active trip banner, Start/Complete, quick actions, open-ticket SLA countdown, critical alerts |
| Trips `(tabs)/trips` | tab | `GET /api/pages/trips` (page/pageSize/status) | filter by status, infinite scroll, MMKV cache fallback |
| Trip detail `trip/[id]` | trip card / push | `GET /api/pages/trips/:id`, `PUT /api/trips/:id/status` | route, stepper, Start/Complete (confirm sheet), details, transactions, Log Fuel/Toll |
| Tickets `(tabs)/tickets`, `ticket/[id]`, `ticket/new` | tab / push | `GET/POST /api/tickets`, `POST /api/tickets/:id/photo` | 11 issue types, priority, GPS reverse-geocode location, photo, history, SLA timer; offline queue for create (photo not queued) |
| Fuel log `fuel/log` | trip detail / quick action | `POST /api/fuel-logs`, `/api/select/*`, `/api/driver/me` | offline queue; odometer photo is captured but **never uploaded** |
| Toll log `toll/log` | same | `POST /api/toll-logs` | offline queue |
| Profile `(tabs)/profile` | tab | `/api/driver/me`, `/api/service-schedules` | vehicle/service-due, appearance (Light/Dark/System), logout |
| Notifications | header | `/api/notifications` | list + deep link |
| Ops group `(ops)/*` | non-Driver roles | pages/tickets/job-cards/spare-parts/tyres/invoices/analytics APIs | mobile ops console (not audited in depth) |
| Cross-cutting | | | offline banner + FIFO queue, Play in-app updates, push registration, token refresh |

Failure behaviour: lists fall back to stale cache; mutations on network error go to the queue (fuel, toll, ticket create only); trip status errors show a toast and nothing is queued.
