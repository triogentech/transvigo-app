import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brand, fontSize, fontWeight, radius, spacing, useColors } from '@/theme';
import { useThemeStore, type ThemeMode } from '@/store/theme.store';

const OPTIONS: { value: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
];

/** Light / Dark / System appearance selector, backed by the persisted theme store. */
export function AppearanceSelector() {
  const c = useColors();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  return (
    <View style={styles.block}>
      <View style={styles.header}>
        <Ionicons name="contrast-outline" size={20} color={c.textSecondary} />
        <Text style={[styles.label, { color: c.textPrimary }]}>Appearance</Text>
      </View>
      <View style={[styles.segment, { backgroundColor: c.bgSunken }]}>
        {OPTIONS.map((o) => {
          const active = mode === o.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => setMode(o.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.item, active && { backgroundColor: c.bgSurface }]}
            >
              <Ionicons name={o.icon} size={16} color={active ? brand.navy : c.textTertiary} />
              <Text style={[styles.itemText, { color: active ? c.textPrimary : c.textTertiary }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.md, paddingVertical: spacing.xs },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  label: { flex: 1, fontSize: fontSize.md },
  segment: { flexDirection: 'row', borderRadius: radius.md, padding: 3, gap: 3 },
  item: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: spacing.sm, borderRadius: radius.sm,
  },
  itemText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
});
