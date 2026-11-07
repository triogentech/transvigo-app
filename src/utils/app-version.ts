import * as Application from 'expo-application';
import Constants from 'expo-constants';

/** Human version (app.json `version`), e.g. "1.2.0". */
export const APP_VERSION: string = Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '0.0.0';

/**
 * Installed Android versionCode (integer). Null when it cannot be read
 * (Expo Go / web) — the backend then neither offers nor forces an update.
 */
export const APP_VERSION_CODE: number | null = (() => {
  const n = Number.parseInt(Application.nativeBuildVersion ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : null;
})();
