import { Linking } from 'react-native';
import { status as st } from '@/theme';
import { usePushStore } from '@/store/push.store';
import { registerForPushNotifications } from '@/utils/notifications';

/** Text, colour and tap action for the "Notifications" row on the profile screens. */
export function usePushStatusView(): { text: string; color: string; onPress?: () => void } {
  const { status } = usePushStore();
  switch (status) {
    case 'registered':
      return { text: 'On', color: st.success };
    case 'denied':
      return { text: 'Off. Tap to allow', color: st.danger, onPress: () => void Linking.openSettings() };
    case 'error':
      return { text: 'Problem. Tap to retry', color: st.danger, onPress: () => void registerForPushNotifications() };
    case 'unsupported':
      return { text: 'Not available here', color: '#9CA3AF' };
    default:
      return { text: 'Checking…', color: '#9CA3AF' };
  }
}
