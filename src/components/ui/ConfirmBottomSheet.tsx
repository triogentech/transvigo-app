import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { fontSize, lineHeight, spacing, useColors } from '@/theme';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';

interface ConfirmBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
}

export function ConfirmBottomSheet({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
}: ConfirmBottomSheetProps) {
  const c = useColors();

  const handleConfirm = (): void => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onConfirm();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} height={300}>
      <Text style={[styles.message, { color: c.textSecondary }]}>{message}</Text>
      <Button variant={confirmVariant} onPress={handleConfirm} fullWidth>
        {confirmLabel}
      </Button>
      <View style={{ height: spacing.sm }} />
      <Button variant="ghost" onPress={onClose} fullWidth>
        Cancel
      </Button>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  message: {
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.normal,
    marginBottom: spacing.xl,
  },
});
