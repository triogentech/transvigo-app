# Touching points in one tap - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native, this session) to implement this plan task-by-task.

**Goal:** A driver reports a touching point with "Reached" (camera opens, one photo) and "Left" (one tap); time and GPS are taken by the app.

**Architecture:** The report logic (location, photo upload, API call) moves out of the component into one function; the `TouchingPoints` component becomes a "next point" view that calls it. No server change.

**Tech Stack:** Expo SDK 58 / React Native 0.88, expo-router, expo-image-picker (camera), existing `trips.api`, `trip-capture` helpers.

**Spec:** docs/superpowers/specs/2026-11-28-touching-points-one-tap-design.md

## Global Constraints
- Photo of the stamped trip sheet is required at reaching; there is NO "photo later" option.
- GPS is required on every report; nothing is saved without it.
- Server rules unchanged (build >= 14 requires location, and a stamped-sheet photo by leaving).
- Trip creation and the approval flow are untouched.
- Wording stays English; the existing error texts are kept.

## Review Focus
1. Camera cancelled or permission denied: nothing is saved, the point stays "not reached", a clear message is shown.
2. GPS fails after the photo was taken: the photo is kept for the retry (the driver does not shoot it again), nothing is saved.
3. Double tap on "Reached" / "Left": exactly one report is sent.
4. "Reached earlier" with a time in the future or before dispatch: the server's message is shown, nothing is saved.
5. "Left" on a point that has no photo (older reports): the camera opens first, then the report is saved.

## File Structure
- Create `src/utils/touching-report.ts`: `reportTouchingPoint()` and `takeStampPhoto()`.
- Modify `src/components/trip/TripFlowSections.tsx`: the `TouchingPoints` component only.
- Modify `docs/` only for this plan and its spec.

### Task 1: Report logic
**Files:** Create `src/utils/touching-report.ts`
**Interfaces:**
- Produces `takeStampPhoto(): Promise<string | null>` - opens the camera, resolves the photo uri, or `null` if the driver cancels; throws `Error('CAMERA_DENIED')` when the permission is refused.
- Produces `reportTouchingPoint(args: { tripId: string; point: TouchingLocation; stage: 'in' | 'out'; time?: Date; photoUri?: string | null }): Promise<Trip>` - gets coordinates with `getCurrentCoords()` (lets `LocationUnavailableError` through), uploads the photo with `tripsApi.uploadTouchingPhoto` when given, then calls `tripsApi.reportTouching(tripId, point.id, stage, time, coords)`.
- Consumes `getCurrentCoords`, `tripsApi.uploadTouchingPhoto`, `tripsApi.reportTouching`.
- [ ] Implement both functions; `takeStampPhoto` uses `ImagePicker.requestCameraPermissionsAsync()` and `launchCameraAsync({ quality: 0.6 })` like `PhotoField`.
- [ ] Verify: `npx tsc --noEmit` has no errors.
- [ ] Commit.

### Task 2: "Next point" view
**Files:** Modify `src/components/trip/TripFlowSections.tsx` (`TouchingPoints`)
**Interfaces:** Consumes Task 1. Props unchanged: `{ trip: Trip; onChanged: () => void }`.
- [ ] The first point that is not both reached and left is "current": show its name large with one button. Reached: `takeStampPhoto()` then `reportTouchingPoint({ stage: 'in', photoUri })`. Left: if the point has no `inSheetPhotoUrl` and no `outSheetPhotoUrl`, `takeStampPhoto()` first; then `reportTouchingPoint({ stage: 'out' })`.
- [ ] Keep one `busy` flag that ignores taps while a report is running (Review Focus 3).
- [ ] Keep the photo uri in state when the location fails so the retry does not reshoot (Review Focus 2); cancelled camera saves nothing (1).
- [ ] A small "Reached earlier?" link on the current point shows the existing `DateTimeField` and passes that time as `time` (Review Focus 4: show the server's message via `errMessage`).
- [ ] Other points: a compact list below (name, in/out times, halt, "Location saved / Stamped sheet added"); finished points first, upcoming ones dimmed, no buttons.
- [ ] Keep the location error messages and "Total halt".
- [ ] Verify: `npx tsc --noEmit` has no errors.
- [ ] Commit.

### Task 3: Check in the browser preview
**Files:** none in the repo (a throwaway script in the job tmp folder)
- [ ] Run the app web preview against the local backend. Expected: Reached -> file chooser -> point saved with GPS and photo (`in_latitude`, `in_sheet_photo_url` set) in 2 taps; Left -> saved with one tap and no sheet; the second point becomes current; cancelling the chooser saves nothing; a point with no photo asks for the photo before Left.
- [ ] Commit any fixes.

### Task 4: Ship
- [ ] Push, open the PR with the spec and plan, merge on the user's word.
- [ ] Start the EAS production build (build 15) from `main`.
