import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, fontWeight, radius, spacing, useColors } from '@/theme';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  const c = useColors();
  return (
    <View style={[styles.banner, { backgroundColor: c.dangerBg, borderColor: c.danger }]}>
      <Ionicons name="alert-circle" size={18} color={c.danger} />
      <Text style={[styles.text, { color: c.danger }]} numberOfLines={3}>
        {message}
      </Text>
      {onRetry ? (
        <Pressable onPress={onRetry} hitSlop={8}>
          <Text style={[styles.retry, { color: c.danger }]}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  text: { flex: 1, fontSize: fontSize.sm },
  retry: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
});
