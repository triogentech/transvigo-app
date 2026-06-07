import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, fontSize, fontWeight, radius, spacing, useColors } from '@/theme';
import { TicketCard } from '@/components/ticket/TicketCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useTickets, type TicketFilter } from '@/hooks/useTickets';

const FILTERS: { label: string; value: TicketFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
];

export default function TicketsScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tickets, loading, loadingMore, error, filter, hasMore, fetchMore, setFilter, refresh } = useTickets();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage, paddingTop: insets.top }}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: c.textPrimary }]}>MY TICKETS</Text>
          <Pressable
            onPress={() => router.push('/ticket/new')}
            style={[styles.raise, { backgroundColor: brand.navy }]}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.raiseText}>Raise</Text>
          </Pressable>
        </View>
        <View style={styles.pills}>
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <Pressable
                key={f.value}
                onPress={() => setFilter(f.value)}
                style={[
                  styles.pill,
                  { backgroundColor: active ? brand.navy : c.bgSunken, borderColor: active ? brand.navy : c.border },
                ]}
              >
                <Text style={[styles.pillText, { color: active ? '#FFFFFF' : c.textSecondary }]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={styles.list}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={130} borderRadius={radius.lg} style={{ marginBottom: spacing.md }} />
          ))}
        </View>
      ) : error ? (
        <View style={styles.list}>
          <ErrorBanner message={error} onRetry={refresh} />
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(t) => t.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.xl }]}
          renderItem={({ item }) => <TicketCard ticket={item} onPress={() => router.push(`/ticket/${item.id}`)} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasMore) void fetchMore();
          }}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={brand.navy} style={{ marginVertical: spacing.lg }} /> : null}
          ListEmptyComponent={<EmptyState icon="checkmark-circle-outline" title="No tickets" subtitle="All good! No issues reported." />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.heavy, letterSpacing: 0.5 },
  raise: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: spacing.md, height: 40, borderRadius: radius.md },
  raiseText: { color: '#FFFFFF', fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  pills: { flexDirection: 'row', gap: spacing.sm },
  pill: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
  pillText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
});
