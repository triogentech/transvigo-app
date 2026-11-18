import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, fontWeight, spacing, useColors } from '@/theme';
import { TripCard } from '@/components/trip/TripCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useActiveTrip } from '@/hooks/useActiveTrip';
import { useDriverMe } from '@/hooks/useDriverMe';

/** Drivers see only their current trip (never past ones) plus a lifetime completed count. */
export default function TripsScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeTrip, refresh } = useActiveTrip();
  const { me, reload } = useDriverMe();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), reload()]);
    setRefreshing(false);
  }, [refresh, reload]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bgPage }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={[styles.title, { color: c.textPrimary }]}>MY TRIP</Text>
      {me?.completedTripCount !== undefined ? (
        <Text style={[styles.count, { color: c.textSecondary }]}>
          {me.completedTripCount} {me.completedTripCount === 1 ? 'trip' : 'trips'} completed
        </Text>
      ) : null}
      {activeTrip ? (
        <TripCard trip={activeTrip} onPress={() => router.push(`/trip/${activeTrip.id}`)} />
      ) : (
        <View style={{ marginTop: spacing.xl }}>
          <EmptyState icon="map-outline" title="No trip assigned" subtitle="Your next trip will appear here as soon as it is assigned." />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.heavy, letterSpacing: 0.5 },
  count: { fontSize: fontSize.sm },
});
