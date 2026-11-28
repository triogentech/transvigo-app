import { getTripRoute } from '@/utils/format';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, fontWeight, spacing, useColors } from '@/theme';
import { TripCard } from '@/components/trip/TripCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import * as tripsApi from '@/api/trips.api';
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
  const [awaiting, setAwaiting] = useState<tripsApi.AwaitingClosure | null>(null);
  const loadAwaiting = useCallback(async () => {
    try {
      setAwaiting((await tripsApi.getTripsPage({ pageSize: 1 })).awaitingClosure ?? null);
    } catch {
      // the card is optional; the rest of the screen still works offline
    }
  }, []);
  useFocusEffect(useCallback(() => { void loadAwaiting(); }, [loadAwaiting]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), reload(), loadAwaiting()]);
    setRefreshing(false);
  }, [refresh, reload, loadAwaiting]);

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
      {awaiting ? (
        <View style={[styles.awaiting, { borderColor: awaiting.closeApproval === 'needs_changes' ? '#dc2626' : c.border, backgroundColor: c.bgCard }]}>
          <Text style={{ color: c.textPrimary, fontWeight: fontWeight.bold }}>
            {awaiting.tripNumber} · {awaiting.closeApproval === 'needs_changes' ? 'Sent back by the office' : 'Closed, waiting for approval'}
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>
            {getTripRoute(awaiting)}
          </Text>
          {awaiting.closeApproval === 'needs_changes' && awaiting.approvalNote ? (
            <Text style={{ color: '#dc2626', fontSize: fontSize.sm }}>{awaiting.approvalNote}</Text>
          ) : null}
        </View>
      ) : null}
      {activeTrip ? (
        <TripCard trip={activeTrip} onPress={() => router.push(`/trip/${activeTrip.id}`)} />
      ) : (
        <View style={{ marginTop: spacing.xl }}>
          <EmptyState icon="map-outline" title="No trip assigned" subtitle="Your next trip will appear here as soon as it is assigned." />
          <View style={{ marginTop: spacing.lg }}>
            <Button size="lg" fullWidth leftIcon="add-circle" onPress={() => router.push('/trip/new')}>
              Create trip
            </Button>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.heavy, letterSpacing: 0.5 },
  count: { fontSize: fontSize.sm },
  awaiting: { borderWidth: 1, borderRadius: 12, padding: spacing.md, gap: 4 },
});
