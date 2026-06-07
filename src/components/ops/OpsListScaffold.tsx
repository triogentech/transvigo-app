import type { ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, fontSize, fontWeight, spacing, useColors } from '@/theme';

export function OpsListScaffold({
  title, loading, error, empty, onRefresh, onAdd, children,
}: {
  title: string;
  loading: boolean;
  error: string | null;
  empty: boolean;
  onRefresh: () => void;
  onAdd?: () => void;
  children: ReactNode;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: c.bgSurface, borderBottomColor: c.border }]}>
        <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
        {onAdd ? (
          <Pressable onPress={onAdd} hitSlop={10}>
            <Ionicons name="add-circle" size={28} color={brand.teal} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={brand.navy} />}
      >
        {error ? <Text style={{ color: c.danger, fontSize: fontSize.sm }}>{error}</Text> : null}
        {!loading && empty && !error ? (
          <Text style={{ color: c.textTertiary, textAlign: 'center', marginTop: spacing.xxl }}>Nothing here yet.</Text>
        ) : null}
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
});
