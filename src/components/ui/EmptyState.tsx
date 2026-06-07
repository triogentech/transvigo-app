import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, fontWeight, lineHeight, spacing, useColors } from '@/theme';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  const c = useColors();
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: c.bgSunken }]}>
        <Ionicons name={icon} size={32} color={c.textTertiary} />
      </View>
      <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: c.textSecondary }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, textAlign: 'center' },
  subtitle: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
});
