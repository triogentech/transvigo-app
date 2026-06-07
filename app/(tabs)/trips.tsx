import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, fontSize, fontWeight, radius, spacing, useColors } from '@/theme';
import { TripCard } from '@/components/trip/TripCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useTrips, type TripFilter } from '@/hooks/useTrips';

const FILTERS: { label: string; value: TripFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'in_transit' },
  { label: 'Completed', value: 'completed' },
  { label: 'Created', value: 'created' },
];

export default function TripsScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { trips, loading, loadingMore, error, filter, hasMore, fetchMore, setFilter, refresh } = useTrips();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage, paddingTop: insets.top }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.textPrimary }]}>MY TRIPS</Text>
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
            <Skeleton key={i} height={120} borderRadius={radius.lg} style={{ marginBottom: spacing.md }} />
          ))}
        </View>
      ) : error ? (
        <View style={styles.list}>
          <ErrorBanner message={error} onRetry={refresh} />
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(t) => t.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.xl }]}
          renderItem={({ item }) => <TripCard trip={item} onPress={() => router.push(`/trip/${item.id}`)} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasMore) void fetchMore();
          }}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={brand.navy} style={{ marginVertical: spacing.lg }} /> : null}
          ListEmptyComponent={<EmptyState icon="map-outline" title="No trips yet" subtitle="Your assigned trips will appear here." />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.heavy, letterSpacing: 0.5 },
  pills: { flexDirection: 'row', gap: spacing.sm },
  pill: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
  pillText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
});
