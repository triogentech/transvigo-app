import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, fontFamily, fontSize, fontWeight, spacing, status as st, useColors } from '@/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { ConfirmBottomSheet } from '@/components/ui/ConfirmBottomSheet';
import { TripStatusStepper } from '@/components/trip/TripStatusStepper';
import { TripExpenses } from '@/components/trip/TripExpenses';
import * as tripsApi from '@/api/trips.api';
import { errMessage } from '@/api/client';
import { showToast } from '@/store/toast.store';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { TripStatus } from '@/types/api.types';

export default function TripDetailScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [detail, setDetail] = useState<tripsApi.TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setDetail(await tripsApi.getTripDetail(id));
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const trip = detail?.trip;
  const nextStatus: TripStatus | null =
    trip?.currentStatus === 'created' ? 'in_transit' : trip?.currentStatus === 'in_transit' ? 'completed' : null;

  const doTransition = async (): Promise<void> => {
    if (!trip || !nextStatus) return;
    try {
      await tripsApi.updateTripStatus(trip.id, nextStatus);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({ type: 'success', message: nextStatus === 'in_transit' ? 'Trip started' : 'Trip completed' });
      await load();
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast({ type: 'error', message: errMessage(e, 'Could not update trip') });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <ScreenHeader title={trip?.tripNumber ?? 'Trip'} />

      {loading ? (
        <View style={styles.content}>
          <Skeleton height={120} />
          <Skeleton height={60} style={{ marginTop: spacing.md }} />
        </View>
      ) : error || !trip ? (
        <View style={styles.content}>
          <ErrorBanner message={error ?? 'Trip not found'} onRetry={load} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}>
          <Card>
            <View style={styles.routeRow}>
              <Ionicons name="ellipse" size={12} color={brand.teal} />
              <Text style={[styles.point, { color: c.textPrimary }]}>{trip.startPoint}</Text>
            </View>
            <View style={[styles.connector, { backgroundColor: c.border }]} />
            <View style={styles.routeRow}>
              <Ionicons name="location" size={14} color={brand.navy} />
              <Text style={[styles.point, { color: c.textPrimary }]}>{trip.endPoint}</Text>
            </View>
            <View style={styles.badgeRow}>
              <StatusBadge status={trip.currentStatus} variant="trip" />
              {trip.vehicle ? (
                <Text style={[styles.vehicle, { color: c.textSecondary }]}>{trip.vehicle.vehicleNumber}</Text>
              ) : null}
            </View>
          </Card>

          <Card>
            <TripStatusStepper status={trip.currentStatus} />
          </Card>

          {nextStatus ? (
            <Button
              size="lg"
              fullWidth
              variant={nextStatus === 'in_transit' ? 'primary' : 'primary'}
              leftIcon={nextStatus === 'in_transit' ? 'play' : 'checkmark-circle'}
              onPress={() => setConfirm(true)}
            >
              {nextStatus === 'in_transit' ? 'Start Trip' : 'Complete Trip'}
            </Button>
          ) : null}

          <Card style={styles.detailsCard}>
            <DetailRow label="Load Provider" value={trip.loadProvider?.name ?? '—'} />
            <DetailRow label="Freight Amount" value={formatCurrency(trip.freightTotalAmount)} mono />
            <DetailRow label="Advance" value={formatCurrency(trip.advanceAmount)} mono />
            <DetailRow label="Estimated Start" value={formatDateTime(trip.estimatedStartTime)} />
            <DetailRow label="Estimated End" value={formatDateTime(trip.estimatedEndTime)} />
            {trip.actualEndTime ? <DetailRow label="Actual End" value={formatDateTime(trip.actualEndTime)} /> : null}
          </Card>

          <Card style={{ padding: 0 }}>
            <Pressable style={styles.collapsibleHeader} onPress={() => setExpenseOpen((o) => !o)}>
              <Text style={[styles.collapsibleTitle, { color: c.textPrimary }]}>
                Transactions ({detail?.transactions?.length ?? 0})
              </Text>
              <Ionicons name={expenseOpen ? 'chevron-up' : 'chevron-down'} size={18} color={c.textTertiary} />
            </Pressable>
            {expenseOpen ? (
              <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
                <TripExpenses transactions={detail?.transactions ?? []} />
              </View>
            ) : null}
          </Card>

          <View style={styles.quickRow}>
            <Button
              variant="secondary"
              leftIcon="water"
              onPress={() => router.push({ pathname: '/fuel/log', params: { tripId: trip.id } })}
              style={{ flex: 1 }}
            >
              Log Fuel
            </Button>
            <Button
              variant="secondary"
              leftIcon="card"
              onPress={() => router.push({ pathname: '/toll/log', params: { tripId: trip.id } })}
              style={{ flex: 1 }}
            >
              Log Toll
            </Button>
          </View>
        </ScrollView>
      )}

      <ConfirmBottomSheet
        visible={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          void doTransition();
        }}
        title={nextStatus === 'in_transit' ? 'Start trip?' : 'Complete trip?'}
        message={
          nextStatus === 'in_transit'
            ? 'Confirm you are starting this trip now.'
            : 'Confirm you have arrived and the trip is complete.'
        }
        confirmLabel={nextStatus === 'in_transit' ? 'Start Trip' : 'Complete Trip'}
      />
    </View>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const c = useColors();
  return (
    <View style={[styles.detailRow, { borderBottomColor: c.border }]}>
      <Text style={[styles.detailLabel, { color: c.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: c.textPrimary, fontFamily: mono ? fontFamily.mono : undefined }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  connector: { width: 2, height: 16, marginLeft: 5, marginVertical: 2 },
  point: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, flex: 1 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  vehicle: { fontFamily: fontFamily.mono, fontSize: fontSize.sm },
  detailsCard: { gap: 0 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailLabel: { fontSize: fontSize.sm },
  detailValue: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  collapsibleTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  quickRow: { flexDirection: 'row', gap: spacing.md },
});
