# Release process (EAS Build + Play Console)

1. Bump `version` in `app.json` **and** `package.json`, and `versionName` in `android/app/build.gradle` (must match — `npm run check:release` / CI `release-check` fails otherwise).
2. versionCode: managed by EAS (`appVersionSource: remote`, `autoIncrement`). Note the number the build produces.
3. `eas build -p android --profile production` (signed with the existing EAS-held upload key; **never** ship a local gradle build — it uses the debug keystore).
4. Upload the AAB to Play Console, complete the release (use a staged rollout for risky changes).
5. When the release is live, open **God Mode → Settings** and publish: latest version + the versionCode from step 2, release notes, message. Uploading to Play does **not** update this policy automatically (no integration exists).
6. Set the minimum + enforcement **only** if the release must be mandatory (breaking API change / security). Default: leave enforcement off.
7. Verify with a device on the previous build installed from the Play internal track: optional prompt, then update.
8. Ordering for backend-dependent releases: deploy backend first, publish app, then raise the minimum.
Rollback: lower/disable enforcement or turn off maintenance in the dashboard — takes effect within ~1 minute (cache).
CI: `.github/workflows/release-check.yml` runs typecheck + version-consistency check.
