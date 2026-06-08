# Releasing TransVigo Driver to the Google Play Store (production)

End-to-end runbook for publishing the **production AAB** to Google Play. This is
the store path; `DISTRIBUTION.md` covers the separate sideloaded-APK workflow.

The build is already configured in `eas.json` (`production` profile → **app
bundle / AAB**, `appVersionSource: remote`, `autoIncrement: true`) and points at
the live backend `https://transvigo-be.transvigo.in`.

---

## 0. One-time prerequisites

1. **Expo account** + EAS CLI, and link the project (writes `extra.eas.projectId`
   into `app.json`):
   ```bash
   npm install -g eas-cli
   eas login
   cd /Users/apple/rrc-be/driver-app
   eas init            # creates/links the EAS project — required for remote versioning
   ```
2. **Google Play Console** developer account (one-time US$25): https://play.google.com/console
3. **Play service account** for `eas submit` (lets EAS upload builds for you):
   - Play Console → *Users and permissions* → invite a Google Cloud service
     account with the *Release* permission, then download its JSON key.
   - Save it as `driver-app/google-play-service-account.json`
     (already referenced by `eas.json` → `submit.production.android`).
   - It is git-ignored — **never commit it**. Verify with `git check-ignore`.

## 1. Branding & assets (done)

Branded assets are generated from the logo by `scripts/gen-brand-assets.py`:
app icon, adaptive icon (white bg), splash (white bg), white-silhouette
notification icon, favicon, plus the store icon and feature graphic in `store/`.
Re-run after any logo change:
```bash
python3 scripts/gen-brand-assets.py
```

## 2. Set the release version

`version` in `app.json` is the user-facing name (currently `1.0.0`). The Android
`versionCode` is managed remotely by EAS and **auto-increments** on each
production build — you don't edit it. Bump `version` for meaningful releases.

## 3. Build the production AAB

```bash
eas build --platform android --profile production
```
Produces a signed `.aab`. The signing key is created and stored by EAS on first
build (Google Play App Signing). Download the AAB link when it finishes (also
available later via `eas build:list`).

## 4. Create the app in Play Console (first release only)

1. Play Console → *Create app* → name **TransVigo Driver**, App, Free.
2. Fill **Store listing** from `store/STORE_LISTING.md`:
   - Short + full description, **App icon** = `store/play-icon-512.png`,
     **Feature graphic** = `store/feature-graphic-1024x500.png`, and ≥2 phone
     screenshots (see TODO in the listing doc).
3. **Policy → App content**:
   - **Privacy policy** URL (host `store/PRIVACY_POLICY.md`).
   - **Data safety** → answer per the table in `store/STORE_LISTING.md`.
   - **Content rating** questionnaire → Business/Utility.
   - **App access** → provide demo Operations + Driver login credentials (the app
     is login-only, so reviewers need them).
   - Target audience, ads (No), government app (No).

## 5. Upload / submit the build

**Option A — `eas submit` (recommended, automated):**
```bash
eas submit --platform android --profile production --latest
```
Uploads the latest production AAB to the **internal** track (per `eas.json`).

**Option B — manual:** Play Console → *Testing → Internal testing* → *Create
release* → upload the `.aab`.

## 6. Test, then promote to production

1. Roll the build out on **Internal testing**, add testers, install via the opt-in
   link, and smoke-test login + a trip + a ticket on the real backend.
2. When happy, Play Console → *Production* → *Create release* → **promote** the
   reviewed build → set rollout % → submit for review.
3. First-time review typically takes a few days.

## 7. Shipping updates

For every subsequent release:
```bash
# (bump `version` in app.json if it's a notable release)
eas build  --platform android --profile production        # versionCode auto-increments
eas submit --platform android --profile production --latest
```
Then promote from internal → production in the console.

The app also bundles **Play in-app updates** (`expo-in-app-updates`,
`src/hooks/useInAppUpdate.ts`) — once a higher versionCode is live on the
production track, installed apps prompt users to update in place.

---

## Pre-submit checklist

- [ ] `eas init` run — `extra.eas.projectId` present in `app.json`
- [ ] `google-play-service-account.json` in place and git-ignored
- [ ] `production` profile API URL = `https://transvigo-be.transvigo.in`
- [ ] Branded icon/splash/notification assets present (not the 222-byte stubs)
- [ ] Privacy policy hosted at a public HTTPS URL
- [ ] Store listing, Data Safety, Content rating, App access completed
- [ ] ≥ 2 phone screenshots uploaded
- [ ] Internal-track smoke test passed before promoting to production
