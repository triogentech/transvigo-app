# Building & distributing the TransVigo Driver app (Android APK)

How to build the driver app into an installable Android APK and get it onto real
drivers' phones — without the Google Play Store.

The app uses **EAS Build** (Expo's cloud build service). The build profiles live in
`eas.json`; all of them produce an **APK** with **internal distribution** (a shareable
download link + QR code), which is the right workflow for a known fleet of drivers.

---

## How the backend URL gets into the app

The app reads its API base URL from `EXPO_PUBLIC_API_URL`. This is an **Expo public
env var — it is frozen into the APK at build time**, not read at runtime. So:

- The value comes from the **build profile's `env` block in `eas.json`**, not from
  your local `.env` (that `.env` only affects `expo start` during development).
- If you point a build at the wrong URL, every phone running that APK is stuck on it
  until you build and distribute a new APK.

| Profile (`eas.json`) | `EXPO_PUBLIC_API_URL` | Use for |
|---|---|---|
| `development` | `http://localhost:3007` | Dev client on the same machine |
| `staging` | `https://staging-api.transvigo.com` | Pre-prod testing |
| `production` | `https://transvigo-be.transvigo.in` | **Real drivers** ✅ |

> Production points at the live backend (`https://transvigo-be.transvigo.in`). If the
> backend domain ever changes, update the `production` profile and rebuild.

---

## 0. Prerequisites (one time)

- A free **Expo account** — https://expo.dev/signup
- **Node.js + npm** on your machine.
- The backend live over **HTTPS** at `https://transvigo-be.transvigo.in` (see below).

Install the EAS CLI and link the project:

```bash
npm install -g eas-cli

# log into your Expo account
eas login

cd /Users/apple/rrc-be/driver-app

# link this app to an EAS project — writes extra.eas.projectId into app.json
eas init
```

---

## 1. Bump the version before each release

So that a new APK cleanly **upgrades** an installed one (instead of "app not
installed" conflicts), increment the Android `versionCode` (an integer) every build,
and update the human-facing `version` when it's a meaningful release. In `app.json`:

```jsonc
{
  "expo": {
    "version": "1.0.1",            // human-facing
    "android": {
      "package": "com.transvigo.driver",
      "versionCode": 2             // MUST increase every build you distribute
    }
  }
}
```

> Alternatively enable `cli.appVersionSource` + `autoIncrement` in `eas.json` to let
> EAS bump `versionCode` automatically. Manual is fine for a small fleet.

---

## 2. Build the APK

```bash
cd /Users/apple/rrc-be/driver-app
eas build --platform android --profile production
```

- **First build only:** EAS offers to **generate an Android keystore** — accept and let
  EAS manage it. ⚠️ Keep this Expo account: the *same* keystore must sign every future
  update, or phones will refuse to upgrade.
- The build runs on Expo's servers (~10–20 min). When it finishes, EAS prints a
  **build page URL** with a **QR code** and a **Download** button.

Find past builds any time at **https://expo.dev → your project → Builds**, or:

```bash
eas build:list --platform android --limit 5
```

---

## 3. Distribute to drivers

Because the profile is `distribution: internal`, the build page is a ready-to-install
link. Two ways to hand it out:

**A. Share the build link / QR (recommended)**
1. Send drivers the EAS **build page URL** (or have them scan the QR).
2. On their Android phone: open it → **Download** → **Install**.
3. Android warns "install from unknown source" → allow it for the browser/files app.
4. Install and open.

**B. Share the raw `.apk` file**
Download the APK from the build page and send it via WhatsApp / Google Drive / email.
Same install steps on the phone. (No auto-update — you re-send a new file each release.)

---

## 4. Shipping an update later

1. Make your code changes.
2. **Bump `versionCode`** in `app.json` (§1) — required, or the upgrade fails.
3. `eas build --platform android --profile production`.
4. Send the new build link; drivers install over the existing app (data preserved,
   same package + keystore).

> **OTA option:** for JS-only changes you can push updates without a new APK using
> `expo-updates` + `eas update`. Native/dependency changes still require a full rebuild.
> Not set up yet — add it later if you want instant JS pushes.

---

## 5. Google Play Store releases & in-app updates

For a real rollout, publish to the **Play Store** instead of sharing APK links. The
Play Store then **auto-updates** the app on every device, and we've also wired
**in-app update prompts** so users get nudged immediately when a new version is live.

### What's already configured
- **`eas.json` `production` profile** builds an **AAB** (`buildType: app-bundle`, the
  format the Play Store requires) with **`autoIncrement: true`** (versionCode bumps
  automatically each build — Play Store rejects duplicate versionCodes). `cli.appVersionSource`
  is `remote`, so EAS tracks the version.
- **`eas.json` `submit.production`** uploads to the Play **internal** track via a
  Google service-account key.
- **In-app updates:** the `expo-in-app-updates` plugin + `useInAppUpdate()` (mounted in
  `app/_layout.tsx`) check Google Play on launch and start a *flexible* update. It's a
  no-op on iOS and on non-Play-Store installs, so it never breaks dev/sideloaded builds.

### One-time setup
1. **Create the app in [Google Play Console]** (≈$25 one-time dev account), package
   `com.transvigo.driver`. Complete the store listing + content rating.
2. **Create a Google service account** (Play Console → Setup → API access → link a GCP
   project → create service account → grant *Release* permissions), download its JSON
   key, and save it as **`google-play-service-account.json`** in the app root.
   It's gitignored — never commit it.
3. **First upload must be manual:** Play requires the very first AAB to be uploaded by
   hand in the console (to register the app signing key). Build one with
   `eas build -p android --profile production`, download the `.aab`, and upload it to an
   **Internal testing** release. After that, `eas submit` works.
4. **Apply the native plugin.** Because `android/` is committed, regenerate it so the
   `expo-in-app-updates` native code is included:
   ```bash
   npx expo prebuild -p android --clean
   ```
   (or delete `android/` to let EAS prebuild it on the server.)

### Each release
```bash
# 1. (optional) bump the human-facing version in app.json — versionCode is automatic
# 2. build the AAB (versionCode auto-increments)
eas build --platform android --profile production
# 3. submit to the Play Store internal track
eas submit --platform android --profile production --latest
```
Promote **Internal → Closed/Open testing → Production** in the Play Console when ready.
Once a release reaches a track a device is on, the user gets the update via the Play
Store automatically **and** the in-app prompt on next launch.

> Switch the `submit.production.track` in `eas.json` from `internal` to `production`
> when you're ready for public rollout. For a forced/blocking update, call
> `checkAndStartUpdate(true)` (immediate) instead of `false` in `useInAppUpdate.ts`.

---

## Pre-flight checklist (before sending to real drivers)

- [ ] **Backend is live over HTTPS** — `curl -I https://transvigo-be.transvigo.in/`
      returns a response with a valid certificate. Production APKs call `https://`;
      phones reject missing/untrusted TLS. (Finish the Certbot install on the server.)
- [ ] `eas.json` **production** `EXPO_PUBLIC_API_URL` = `https://transvigo-be.transvigo.in`.
- [ ] `versionCode` increased since the last distributed build.
- [ ] Built with `--profile production` (not `development`/`staging`).
- [ ] Test-installed on **one** phone and logged in successfully before mass send.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| App opens but "Can't reach the server" | Wrong/stale `EXPO_PUBLIC_API_URL` baked into the APK, or backend HTTPS down. Verify the production profile URL and that `https://transvigo-be.transvigo.in` responds, then rebuild. |
| "App not installed" / signature conflict | A different keystore, or `versionCode` not increased. Use the same Expo account/keystore and bump `versionCode`. |
| Install blocked on phone | Enable "Install unknown apps" for the browser/Files app in Android settings. |
| Network/SSL error only on phones | TLS cert not installed/invalid on the server. Fix Nginx + Certbot so the cert is actually served. |
| `eas` command not found | `npm install -g eas-cli`. |

---

### Quick reference

```bash
eas login                                              # once
eas init                                               # once (links projectId)
# each release:
#   1) bump android.versionCode in app.json
eas build --platform android --profile production      # build the APK
eas build:list --platform android --limit 5            # find the download link again
```
