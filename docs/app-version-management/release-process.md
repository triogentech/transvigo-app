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

## Play Console "recommended actions" (addressed on branch `fix/play-console-recommendations`)
| Play warning | Change | Verified? |
|---|---|---|
| DEX code optimization below threshold (obfuscation 1%) | R8 minify + resource shrinking enabled for release (`android/gradle.properties`), extra keep rules in `proguard-rules.pro` | **No** — not built locally (disk). Test the EAS build on a device before rollout; R8 can break reflection-based libs at runtime only |
| Orientation / resizability restrictions | `app.json` orientation `default`, `screenOrientation` removed from MainActivity; phones (<600dp) locked to portrait at runtime via `expo-screen-orientation`; unused `expo-camera` (source of the ML Kit scanner activity) removed, `expo-image-picker` plugin added for camera text | config validated only; **phone portrait lock + tablet rotation untested on device** |
| Deprecated edge-to-edge APIs | removed the obsolete `android:statusBarColor` theme item. The remaining flagged calls are inside React Native, react-native-screens, Material Components and expo-image-picker, not app code | They will persist until the Expo SDK is upgraded (SDK 55+) |
After the build: check the merged manifest has no `screenOrientation` and that Play's pre-launch report/Android vitals show no new crashes (and a mapping file is attached to the release).
