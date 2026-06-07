import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as driverApi from '@/api/driver.api';

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
  if (isExpoGo) return;
  try {
    await configureAndroidChannels();

    const existing = await Notifications.getPermissionsAsync();
    let granted = existing.granted;
    if (!granted) {
      const requested = await Notifications.requestPermissionsAsync();
      granted = requested.granted;
    }
    if (!granted) return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const tokenResponse = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    await driverApi.registerPushToken(tokenResponse.data, platform);
  } catch {
    // Push registration must never block the app.
  }
}

/** Maps a notification's data payload to an in-app route. */
export function routeForNotification(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  const type = data.type;
  if ((type === 'TICKET_STATUS_UPDATED' || type === 'TICKET_SLA_WARNING') && data.ticketId) {
    return `/ticket/${String(data.ticketId)}`;
  }
  if (type === 'TRIP_ASSIGNED' && data.tripId) {
    return `/trip/${String(data.tripId)}`;
  }
  if (type === 'SERVICE_DUE') {
    return '/(tabs)/profile';
  }
  return null;
}
