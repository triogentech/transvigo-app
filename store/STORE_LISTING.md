# Play Store listing — TransVigo Driver

Copy/paste content and form answers for the Google Play Console listing.
Assets referenced here live in this `store/` folder.

---

## App details

| Field | Value |
|---|---|
| App name | `TransVigo Driver` |
| Package name | `com.transvigo.driver` |
| Default language | English (United States) – `en-US` |
| App or game | App |
| Free or paid | Free |
| Category | Business |
| Tags | Fleet, Logistics, Productivity |
| Contact email | `support@transvigo.in` |
| Website | `https://transvigo.in` |
| Privacy policy URL | `https://transvigo.in/privacy` (host `store/PRIVACY_POLICY.md`) |

## Short description (≤ 80 chars)

```
Trips, expenses, and maintenance for your fleet — in one driver app.
```

## Full description (≤ 4000 chars)

```
TransVigo Driver is the companion app for drivers and operations staff of a
TransVigo-managed fleet. Stay on top of your assigned work from one place.

DRIVERS
• See your assigned trips with route, schedule, and load details
• Start, run, and complete trips with one tap — vehicle and status stay in sync
• Log fuel and toll expenses on the go, with receipt photos
• Raise maintenance tickets for your vehicle, attach a photo, and pick the issue
• See who a ticket was assigned to and contact them directly
• Get push notifications when work is assigned or a status changes

OPERATIONS & MAINTENANCE
• Triage tickets and generate job cards
• Manage spare parts, tyres, suppliers, and invoices
• Review trips and maintenance at a glance
• Assign work to the right person and keep everyone notified

Light and dark mode, secure sign-in with email or phone, and a fast,
offline-tolerant interface built for life on the road.

Note: TransVigo Driver is a workforce app. Your account is provided by your
employer; it is not intended for general public sign-up.
```

## Graphics assets

| Asset | Spec | File |
|---|---|---|
| App icon (hi-res) | 512×512 PNG | `store/play-icon-512.png` |
| Feature graphic | 1024×500 PNG | `store/feature-graphic-1024x500.png` |
| Phone screenshots | 2–8, min 320px, 16:9 or 9:16 | **TODO — capture from a production build** |

> Screenshots are still required by Google (min 2). Capture them from a release
> build: Home/Hub, a trip detail, fuel/toll logging, a ticket with photo, and the
> notifications screen. Put them in `store/screenshots/`.

---

## Data Safety form answers

The app collects the following. Source: declared permissions + features.

| Data type | Collected | Shared | Purpose | Optional? |
|---|---|---|---|---|
| Name | Yes | No | App functionality, account management | Required (set by employer) |
| Email address | Yes | No | App functionality, account management | Required |
| Phone number | Yes | No | App functionality, account management | Required |
| Approximate location | Yes | No | App functionality (incident/ticket location) | Optional (permission) |
| Precise location | Yes | No | App functionality (incident/ticket location) | Optional (permission) |
| Photos | Yes | No | App functionality (receipts, ticket evidence) | Optional |
| App activity (in-app actions) | Yes | No | App functionality, analytics (operational) | Required |
| Device IDs (push token) | Yes | No | App functionality (notifications) | Required |

Additional declarations:
- **Is all data encrypted in transit?** Yes (HTTPS).
- **Do you provide a way to request data deletion?** Yes — via the fleet operator
  / `support@transvigo.in`.
- **Is data sold?** No.
- **Used for advertising?** No.
- Location is **not** collected in the background (only while in use).

## Content rating

Complete the IARC questionnaire as a **Business/Utility** app with no user-to-user
content, no violence, no sensitive material → expected rating: **Everyone**.

## App access (for review)

The app requires login and accounts are operator-provisioned, so Google's
reviewers cannot self-register. Under **App content → App access**, provide test
credentials (a demo Operations + a demo Driver account on the production backend)
so the review team can sign in.
