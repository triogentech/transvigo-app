import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as driverApi from '@/api/driver.api';
import { useAuthStore } from '@/store/auth.store';
import { usePushStore } from '@/store/push.store';

/**
 * True when running inside Expo Go. Remote push notifications were removed from
 * Expo Go in SDK 53, so registration must be skipped there (it only works in a
 * development or production build).
 */
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Foreground presentation: show the banner + list entry, play a sound.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Android notification channels (created once; no-op on iOS). */
export async function configureAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('tickets', {
    name: 'Tickets',
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: '#DC2626',
  });
  await Notifications.setNotificationChannelAsync('trips', {
    name: 'Trips',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  await Notifications.setNotificationChannelAsync('alerts', {
    name: 'Alerts',
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: '#D97706',
  });
}

/**
 * Requests permission (gracefully — no-op if denied), fetches the Expo push
 * token, and registers it with the backend. Best-effort: never throws.
 * (Remote push needs a dev/standalone build — it is unavailable in Expo Go.)
 */
export async function registerForPushNotifications(): Promise<void> {
  // Remote push is unavailable in Expo Go (removed in SDK 53) — skip cleanly.
  if (isExpoGo || Platform.OS === 'web') {
    usePushStore.getState().set('unsupported');
    return;
  }
  try {
    await configureAndroidChannels();

    const existing = await Notifications.getPermissionsAsync();
    let granted = existing.granted;
    if (!granted) {
      const requested = await Notifications.requestPermissionsAsync();
      granted = requested.granted;
    }
    if (!granted) {
      usePushStore.getState().set('denied');
      return;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const tokenResponse = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    await driverApi.registerPushToken(tokenResponse.data, platform);
    usePushStore.getState().set('registered');
  } catch (e) {
    // Never block the app, but do not hide it either: a missing Firebase config (no
    // google-services.json in the build) fails right here and means NO push on the phone.
    const message = e instanceof Error ? e.message : String(e);
    // eslint-disable-next-line no-console
    console.warn('[push] registration failed:', message);
    usePushStore.getState().set('error', message);
  }
}

/** Sign-out: tell the server this phone no longer belongs to the user (best-effort). */
export async function unregisterPushNotifications(): Promise<void> {
  try {
    await driverApi.unregisterPushToken();
  } catch {
    // ignore
  }
  usePushStore.getState().set('unknown');
}

/** Maps a notification's data payload to an in-app route. */
export function routeForNotification(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  const type = data.type;
  if ((type === 'TICKET_STATUS_UPDATED' || type === 'TICKET_SLA_WARNING' || type === 'TICKET_MESSAGE') && data.ticketId) {
    return `/ticket/${String(data.ticketId)}`;
  }
  if (type === 'TRIP_ASSIGNED' && data.tripId) {
    return `/trip/${String(data.tripId)}`;
  }
  if ((type === 'JOB_CARD_MESSAGE' || type === 'JOB_CARD_REPORTED') && data.jobCardId) {
    // Staff open the ops job-card screen; drivers open their own report.
    const staff = useAuthStore.getState().user?.role !== 'Driver';
    return staff ? `/job-card/${String(data.jobCardId)}` : `/maintenance/${String(data.jobCardId)}`;
  }
  if (type === 'TICKET_ASSIGNED' && data.ticketId) {
    return `/ticket/${String(data.ticketId)}`;
  }
  if (type === 'JOB_CARD_ASSIGNED' && data.jobCardId) {
    return `/job-card/${String(data.jobCardId)}`;
  }
  if (type === 'DRIVER_LOCATION_DENIED') {
    return '/(ops)/trips';
  }
  if (type === 'SERVICE_DUE') {
    return '/(tabs)/profile';
  }
  return null;
}
