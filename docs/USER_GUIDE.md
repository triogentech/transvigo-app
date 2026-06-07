# TransVigo Driver — User Guide

## Who this app is for

The TransVigo Driver app is for **truck and fleet drivers**. It is the driver's
window into the TransVigo fleet-management system: the same trips, vehicles, and
maintenance tickets that fleet managers handle from the office, drivers see and
act on from their phone, out on the road.

A driver belongs to an **organisation** (their transport company) and is linked
to a **vehicle** and the **trips** assigned to them. They sign in with the email
or phone number their company registered, and from then on the app shows only
their own work.

The app is built for real driving conditions — outdoors, in low light, with
gloved hands, and on patchy mobile networks. Anything a driver records while
offline is saved on the phone and sent automatically once signal returns, so
they never lose a fuel entry or an incident report because of dead coverage.

---

## What a driver can do

### 1. Sign in
Drivers log in with their email or phone number and password. If they belong to
more than one organisation, they also enter their organisation code. On first
login they're asked to set a new password. They stay signed in across app
restarts and don't have to log in again every day.

### 2. See the day at a glance (Home)
The Home screen greets the driver and shows the **active trip** front and centre:
where they're going, the route, and a one-tap way to mark it complete. If there's
no trip running, it simply says so.

Below that are:
- **Quick Actions** — shortcuts to report an issue, log fuel, log a toll, or jump
  to their trips.
- **Alerts** — urgent items that need attention, such as a critical breakdown
  ticket or a ticket whose response deadline is running out or already missed.
- **Recent tickets** — the latest open issues on their vehicle.

### 3. Manage trips
The **Trips** tab lists every trip assigned to the driver, filterable by *All,
Active, Completed,* or *Created*. Each trip shows its route, status, and key
figures. Opening a trip reveals the full detail — pickup and drop points, timing,
freight and advance amounts, expenses, and a status stepper.

From the trip, the driver moves it through its lifecycle:
**Created → In Transit → Completed**. Tapping to start or complete a trip gives a
small haptic confirmation, so it's clear the action registered even at a glance.

### 4. Raise and track tickets
A **ticket** is how a driver reports a problem with the vehicle or trip — a
breakdown, an accident, a tyre puncture, an engine/electrical/brake issue, a
service-due reminder, a complaint, or anything else.

When raising a ticket the driver picks the issue type and priority, writes a
short title and description, and the app can **auto-fill their current location**
so dispatch knows where they are. The ticket is sent to the office immediately —
or queued and sent later if they're offline.

The **Tickets** tab lists their tickets (filter by *All, Open, In Progress,
Resolved*), and a badge shows how many are still open. Opening a ticket shows its
full history and a **response-time countdown** based on its priority:

| Priority | Target response time |
|----------|----------------------|
| Critical | 4 hours |
| High | 8 hours |
| Medium | 24 hours |
| Low | 72 hours |

The countdown turns to a warning as the deadline nears and flags clearly once
it's overdue, so both the driver and the office can see which issues are slipping.

### 5. Log fuel
The **Log Fuel** screen records a refuel: date, fuel type (diesel/petrol/gas),
quantity, rate, and the fuel station — the total is calculated for them. They can
attach a **photo of the receipt or pump** and tie the entry to the current trip.

### 6. Log tolls
The **Log Toll** screen records toll spending on a trip — the total amount and
the number of toll crossings — tied to the trip and vehicle.

### 7. Profile & account
The **Profile** tab shows the driver's details, their assigned vehicle, and
upcoming/overdue **service schedules** for that vehicle. From here they can
change their password, toggle notifications, and sign out.

### 8. Stay informed (notifications)
The app sends push notifications for things the driver needs to know — a ticket's
status changing, a ticket nearing its SLA deadline, a new trip assignment, or a
service coming due. Tapping a notification opens the relevant ticket, trip, or
the Profile screen directly.

---

## Working offline

Drivers spend much of their time where coverage is poor. The app is built for it:

- **Recording works offline.** Raising a ticket, logging fuel, and logging a toll
  all work with no signal. The entry is saved on the phone and the driver is told
  it will sync later.
- **It syncs itself.** As soon as the phone is back online, queued entries are
  sent in the order they were made, and the driver gets a confirmation that
  pending actions synced.
- **Recent data stays visible.** Trips, tickets, and the active trip show the
  last-known information instantly — even on a cold start with no signal — and
  refresh quietly once connected.

A banner at the top of the screen tells the driver when they're offline and when
work is waiting to sync.

---

## A typical day

1. **Morning** — Open the app; it's already signed in. Home shows today's active
   trip.
2. **Start driving** — Open the trip and mark it *In Transit*.
3. **Refuel** — Log the fuel with a photo of the receipt; it attaches to the trip.
4. **Toll booth** — Log the toll amount and crossings.
5. **Breakdown** — Raise a ticket with the issue type, priority, and the
   auto-filled location. The office sees it within the SLA window and responds.
   If there's no signal, it sends itself once coverage returns.
6. **Arrival** — Mark the trip *Completed*.
7. **Anytime** — Check the Tickets tab for updates; tap a notification to jump
   straight to what changed.

---

## Good to know

- **Your data is yours.** A driver only ever sees their own trips, tickets, and
  vehicle — scoped to their organisation.
- **Sign-in is secure.** Login credentials are stored in the phone's secure
  hardware (Keychain/Keystore), not in plain app storage.
- **Light and dark mode** follow the phone's system setting automatically.
