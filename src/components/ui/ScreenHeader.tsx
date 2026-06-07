import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, fontWeight, spacing, useColors } from '@/theme';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  right?: ReactNode;
}

export function ScreenHeader({ title, onBack, icon = 'arrow-back', right }: ScreenHeaderProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const handleBack = onBack ?? (() => router.back());

  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top + spacing.sm, backgroundColor: c.bgSurface, borderBottomColor: c.border },
      ]}
    >
      <Pressable onPress={handleBack} hitSlop={10} style={styles.side}>
        <Ionicons name={icon} size={24} color={c.textPrimary} />
      </Pressable>
      <Text style={[styles.title, { color: c.textPrimary }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.side}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  side: { minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: fontSize.lg, fontWeight: fontWeight.bold },
});
