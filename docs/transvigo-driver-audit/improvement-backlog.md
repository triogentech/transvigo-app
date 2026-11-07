# Improvement backlog

Priority: P0 broken/security, P1 daily-ops impact, P2 quality, P3 optional.

## A. Mobile-only
| Feature | Problem | Solution | Driver | Ops | Backend dep | Cx | Pri |
|---|---|---|---|---|---|---|---|
| Trip status wire fix | Start rejected (400) | map to `in-transit` | can start trips | status visible | none | L | P0 **done** |
| Refresh-failure ≠ logout | offline launch signs driver out | distinguish rejection from network | stays signed in | fewer "can't log in" calls | none | L | P0 **done** |
| Queue retains transient failures | silent data loss | keep 401/408/429, 6 retries | no lost logs | complete data | none | L | P1 **done** |
| Double-submit guard + pull-to-refresh on trip | duplicate taps, stale detail | `acting` flag, RefreshControl | reliability | — | none | L | P2 **done** |
| Remove RECORD_AUDIO, foreground-only location text | unneeded permission | config | trust | Play compliance | none | L | P2 **done** |
| Show next assigned trip on Home | assigned trips hidden | query `created` too, Start CTA | fewer taps | faster dispatch | none | M | P1 |
| "Navigate" button | no maps | `geo:`/Google Maps URL from coords or address | easier | — | none | L | P1 |
| Queue trip status changes offline | status lost when no signal | queue PUT with latest-wins | works on highways | accurate status | idempotent PUT already (same state) | M | P1 |
| Queue photos | photo lost offline | persist file URI, upload after create | evidence kept | invoices/proof | none | M | P2 |
| Single SLA ticker, tab badge fix | perf/confusion | shared timer, Tickets-only badge | smoother | — | none | L | P2 |
| ESLint + jest for api/queue/auth | no safety net | add configs/tests | — | — | none | M | P2 |

## B. Needs backend change (documented, **not implemented**)
| Feature | Change | Pri |
|---|---|---|
| Driver-scoped trip transition | e.g. `PATCH /api/driver/trips/:id/status` verifying trip.driverId/vehicle ownership and allowed transitions (created→in-transit→completed), no `trips:update` grant | **P0** |
| Trip-assignment push | in `createTrip`/`updateTrip` when driver or vehicle changes: `notifyUser(driver.userId, {type:'TRIP_ASSIGNED', tripId})` | P1 |
| Idempotency keys | accept `Idempotency-Key` header on fuel/toll/ticket POST, store & dedupe | P1 |
| Fuel-log photo endpoint | needed to honour the odometer photo | P2 |
| Accept/reject trip, delay/exception reporting | product decision first | P3 |

## C. Dashboard changes
Show last driver update time on trips; flag trips stuck in `created` > X hours. (P2)

## D. External integrations
Map SDK / live location: requires business + privacy sign-off, backend storage, background-location Play declaration. (P3, **not started**)
