import { Alert, Platform } from 'react-native';

/** Confirm a destructive action. Alert.alert buttons are a no-op on react-native-web, so use window.confirm there. */
export function confirmAction(title: string, message: string, confirmText: string, onConfirm: () => void): void {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmText, style: 'destructive', onPress: onConfirm },
  ]);
}
