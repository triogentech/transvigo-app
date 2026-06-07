import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { brand, fontSize, spacing } from '@/theme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  if (!visible) return null;
  return (
    <View style={styles.overlay} pointerEvents="auto">
      <View style={styles.box}>
        <ActivityIndicator size="large" color={brand.navy} />
        {message ? <Text style={styles.text}>{message}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  box: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: spacing.xl,
    alignItems: 'center',
    minWidth: 120,
  },
  text: { marginTop: spacing.md, fontSize: fontSize.sm, color: '#111827' },
});
