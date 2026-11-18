# Push notifications

## Notifications that are sent today

All are sent by `transvigo-be` through the Expo Push API (which hands them to Firebase on Android). They are
real notification messages, so Android shows them even when the app is closed. Tapping one opens the screen shown.

### To drivers
| Notification | When | Opens |
| --- | --- | --- |
| **New trip assigned** — "Mumbai → Pune (TRIP-NO)" | A trip is created for the driver, or reassigned to them while still not started | The trip |
| **Message on {job card}** — the ops message | Ops reply on the driver's maintenance report | The report and its conversation |
| **Maintenance report resolved** | Ops resolve the report | The report |
| **Ticket {no}** — "Status updated to …" | A ticket the driver raised changes status | The ticket |

### To staff (Admin, Staff, Operations)
| Notification | When | Opens |
| --- | --- | --- |
| **{PRIORITY} maintenance report · {vehicle}** — issue + "reply within N min" | A driver sends a maintenance report. The auto-assigned Operations user's title starts "Assigned to you ·" | The job card |
| **Driver replied on {job card}** | The driver writes on a report. Goes to the assigned supervisor and whoever acknowledged it; if neither, to all staff | The job card |
| **Driver location is off** | A driver cannot start or complete a trip because location is denied or unavailable (at most once per trip and stage every 10 minutes) | The trips list |
| **You've been assigned Ticket / Job Card {no}** | An item is assigned to them manually or automatically | The ticket / job card |

### Email only (no push yet)
A driver raises a ticket, logs fuel, or logs a toll: staff get an email, not a push.

### The app understands these, but nothing sends them yet
`TICKET_SLA_WARNING` and `SERVICE_DUE`. There is also no push when a maintenance report's reply deadline is about to pass
or has passed.

## Making it work when the app is closed (Android)

Android push needs Firebase. **Without it the phone never gets a push token and no notification arrives, open or closed.**
The app shows this in Profile, Notifications ("Problem. Tap to retry"), and logs `[push] registration failed`.

1. Firebase console: create (or reuse) a project, add an Android app with package **`com.transvigo.driver`**, download
   **`google-services.json`**.
2. Put it at `driver-app/google-services.json` and set `"android": { "googleServicesFile": "./google-services.json" }` in
   `app.json`. Then regenerate the native project: `npx expo prebuild --clean -p android --no-install`, and commit.
3. Firebase console, Project settings, Service accounts: **Generate new private key**. Upload it to EAS:
   `eas credentials` → Android → production → *Google Service Account Key for FCM V1*.
4. Build with EAS and install on a phone.

## Testing with the app closed

1. Sign in on the phone, tap **Allow** on the notification prompt. Profile should show Notifications: **On**.
2. **Swipe the app away** (close it completely).
3. From `transvigo-be`, with the matching database configured:
   `npx tsx scripts/send-test-push.ts <email-or-username>`
   It sends a test push and then reads Expo's receipt. Receipt `OK` means it was handed to Firebase. An error names the cause
   (`InvalidCredentials` = step 3 above missing; `MismatchSenderId` = wrong `google-services.json`;
   `DeviceNotRegistered` = app uninstalled).
4. Real flows to try: assign a trip to the driver; send a maintenance report and reply from the ops app; deny location on a trip start.

## Things that can still stop a notification on a real phone
- **Notification permission** denied (Android 13+): the Profile row says Off; tap to open settings.
- **Aggressive battery managers** on some phones (Xiaomi, Oppo, Vivo, Realme, Samsung "sleeping apps") can block a closed app.
  Set the app to "No restrictions" / allow autostart.
- **Signing out** detaches the phone from the account on purpose, so a shared phone does not show the previous user's notifications.
