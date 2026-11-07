# Expo OTA (EAS Update) strategy

Current: **not configured** (`expo-updates` absent, no `runtimeVersion`/channels). Not introduced in this change.

Assessment: useful for JS-only fixes to a fleet that is slow to update, but adopting it changes the native binary (adds `expo-updates`, `runtimeVersion`, update URL) and so requires a Play release first; it is also a second way to alter behaviour in production, so it needs its own approval.

If adopted: `runtimeVersion: { policy: "appVersion" }`, channels `staging` / `production` mapped to build profiles, publish with `eas update --channel production`; a bundle only reaches binaries with the same runtime version, so incompatible bundles cannot reach old binaries.
OTA is appropriate for: JS/UI fixes, copy, bug fixes with no native/permission/SDK change. A Play release is required for: native modules, permissions, Expo SDK/RN upgrades, `app.json` native config.
Independence: the version policy and the server-side start-trip gate keep working regardless of OTA (they key off the installed **binary** versionCode, not the JS bundle).
