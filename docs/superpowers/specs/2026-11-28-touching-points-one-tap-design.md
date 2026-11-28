# Touching points: one tap to reach, one tap to leave

Status: awaiting approval. Nothing here is built.

## Why
A driver reports each touching point today with about 6-8 taps (open a sheet, confirm a time, add a photo, save; then again to leave). With several points on a trip this is the biggest share of the roughly 30 actions a trip asks for, and drivers find it too many steps. The stamp on the trip sheet is made at the point, the moment the driver arrives.

## Goals
- Reaching a point: tap "Reached", photograph the stamped trip sheet, done. Time and GPS are taken by the app.
- Leaving a point: one tap, nothing else.
- The driver sees one thing at a time: the next point, with one big button.

## Non-goals (later pieces of "make it easier")
- Detecting arrival automatically from the location (needs coordinates for every point, which the system does not hold today).
- Saving photos and reports on the phone when there is no network and sending them later.
- Reading the odometer from its photo; remembering routes and TAT when a trip is created.
- Any change to trip creation or to the approval flow. Both stay exactly as they are.

## Anti-goals
- Skipping the stamped-sheet photo. It stays required, and there is no "photo later" option.
- Saving a wrong or missing GPS position silently.

## Constraints
- Server rules are unchanged: from build 14 every report needs the location, and leaving needs a stamped-sheet photo taken when reaching or leaving. This design simply takes the photo at reaching, so leaving is satisfied.
- Operations adds the touching points; the order and the "left the previous point first" rules stay.
- Needs a new app build (15). Older builds keep working.

## Approaches considered
1. **One tap with the photo at reaching (chosen).** Same data as today, far fewer taps, no server change.
2. Keep the confirmation sheet but pre-fill it. Smaller gain; still several taps per point.
3. Arrival detected from the location, driver only confirms. Largest gain, but needs coordinates for every point and background location (battery); a later step.

## Decisions
- **Reached:** tap -> the camera opens at once -> after the photo, the app reads GPS, uses the current time, uploads the photo and saves the report. No confirmation sheet.
- **"Reached earlier?"** a small secondary link before the camera lets the driver set an earlier time (the existing time field), for a driver who forgot to tap on arrival.
- **Left:** one tap; current time and GPS; no sheet. If, for an older trip, no photo was taken, the camera opens first (the server still requires it).
- **Focus:** the next point is shown large with its button; the rest of the list is smaller below, with reached/left times and "Location saved / Stamped sheet added" as today.
- **Errors:** no GPS, location off, or camera permission off keep the clear messages the app has now; nothing is saved without them.

## Left to the builder
Exact layout and wording (Hindi/English labels), how the camera and the save are chained, and testing (browser preview plus an Android emulator build).
