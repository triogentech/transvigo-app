# UX audit (code-based; no device session was run)

Strengths: consistent theme tokens, light/dark/system, confirm sheet before status changes, skeletons/error banners/empty states, offline banner, haptics, large primary buttons.

Problems, in driver-priority order:
1. **Assigned (`created`) trips are invisible on Home** — only the in-transit trip is shown. "Ready to Roll? No trips assigned" can appear while a trip is waiting. Home should show next assigned trip with a Start button.
2. **No navigation help** — trip detail shows text addresses only; no "Navigate" deep link (Google Maps intent) and no call-contact action. `startPointCoords/endPointCoords` exist on the trip model, so this needs no backend change.
3. **Failure feedback on Start/Complete** is a toast only; no retry, no queued state.
4. Duplicate badge on Home and Tickets tabs is confusing.
5. Fuel screen advertises an odometer photo that is silently discarded.
6. Trip detail shows financial fields (freight, advance) first, above operational ones; a driver mostly needs route, vehicle, load provider, ETA.
7. Accessibility: no `accessibilityLabel`s on icon-only buttons found in the screens sampled; tap targets not verified on device.
8. 1-second SLA ticking text will be announced/re-rendered continuously by screen readers.
