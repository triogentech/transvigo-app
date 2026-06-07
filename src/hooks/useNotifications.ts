import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { registerForPushNotifications, routeForNotification } from '@/utils/notifications';

/**
 * Registers the device for push once authenticated, and routes on notification
 * taps (foreground/background and cold-start). Mount once at the app root.
 */
export function useNotifications(): void {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Register the Expo push token after login / on relaunch while signed in.
  useEffect(() => {
    if (isAuthenticated) void registerForPushNotifications();
  }, [isAuthenticated]);

  // Route when the user taps a notification.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      const path = routeForNotification(data);
      if (path) router.push(path);
    });

    // Handle a tap that cold-started the app.
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      const path = routeForNotification(data);
      if (path) router.push(path);
    });

    return () => sub.remove();
  }, [router]);
}
