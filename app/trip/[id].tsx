import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, fontFamily, fontSize, fontWeight, spacing, status as st, useColors } from '@/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { ZoomableImage } from '@/components/ui/ZoomableImage';
import { TripStatusStepper } from '@/components/trip/TripStatusStepper';
import { TripExpenses } from '@/components/trip/TripExpenses';
import { ApprovalBanner, MissingPhotos, TouchingPoints } from '@/components/trip/TripFlowSections';
import * as tripsApi from '@/api/trips.api';
import { errMessage } from '@/api/client';
import { showToast } from '@/store/toast.store';
import { selectMode, useUpdateStore } from '@/store/update.store';
import { formatDateTime, hasRoute } from '@/utils/format';
import { allocatedMinutes, formatDuration, remainingMinutes, useNow } from '@/utils/trip-time';
import type { Trip, TripStatus } from '@/types/api.types';

export default function TripDetailScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [detail, setDetail] = useState<tripsApi.TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
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

  // Coming back from the start/complete screen: refresh silently.
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void load(true);
    }, [load]),
  );
  const now = useNow();

  const updateMode = useUpdateStore((u) => selectMode(u));
  const trip = detail?.trip;
  const nextStatus: TripStatus | null =
    trip?.currentStatus === 'created' ? 'in_transit' : trip?.currentStatus === 'in_transit' ? 'completed' : null;

  // Outdated app / maintenance: starting a NEW trip is blocked (server enforces too);
  // completing an in-progress trip is always allowed.
  const startBlocked = nextStatus === 'in_transit' && (updateMode === 'mandatory' || updateMode === 'maintenance');

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
          <ErrorBanner message={error ?? 'Trip not found'} onRetry={() => void load()} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load(true);
                setRefreshing(false);
              }}
            />
          }
        >
          <Card>
            {hasRoute(trip) ? (
              <>
                <View style={styles.routeRow}>
                  <Ionicons name="ellipse" size={12} color={brand.teal} />
                  <Text style={[styles.point, { color: c.textPrimary }]}>{trip.startPoint || '—'}</Text>
                </View>
                <View style={[styles.connector, { backgroundColor: c.border }]} />
                <View style={styles.routeRow}>
                  <Ionicons name="location" size={14} color={brand.navy} />
                  <Text style={[styles.point, { color: c.textPrimary }]}>{trip.endPoint || '—'}</Text>
                </View>
              </>
            ) : (
              <Text style={{ color: c.textSecondary }}>Route will be added by the office</Text>
            )}
            <View style={styles.badgeRow}>
              <StatusBadge status={trip.currentStatus} variant="trip" />
              {trip.vehicle ? (
                <Text style={[styles.vehicle, { color: c.textSecondary }]}>{trip.vehicle.vehicleNumber}</Text>
              ) : null}
            </View>
          </Card>

          <ApprovalBanner trip={trip} />

          <Card>
            <TripStatusStepper status={trip.currentStatus} />
          </Card>

          <MissingPhotos trip={trip} onDone={() => void load(true)} />
          <TouchingPoints trip={trip} onChanged={() => void load(true)} />

          {nextStatus ? (
            <Button
              size="lg"
              fullWidth
              variant={nextStatus === 'in_transit' ? 'primary' : 'primary'}
              leftIcon={nextStatus === 'in_transit' ? 'play' : 'checkmark-circle'}
              disabled={startBlocked}
              onPress={() =>
                router.push({ pathname: '/trip/capture', params: { id: trip.id, stage: nextStatus === 'in_transit' ? 'start' : 'end' } })
              }
            >
              {nextStatus === 'in_transit' ? 'Start Trip' : 'Complete Trip'}
            </Button>
          ) : null}

          {startBlocked ? (
            <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>
              {updateMode === 'maintenance'
                ? 'New trips can’t be started during maintenance.'
                : 'Update TransVigo to start new trips.'}
            </Text>
          ) : null}

          <Card style={styles.detailsCard}>
            <DetailRow label="Allocated time" value={formatDuration(allocatedMinutes(trip))} />
            {trip.currentStatus === 'in_transit' && trip.actualStartTime ? (
              <>
                <DetailRow label="Started" value={formatDateTime(trip.actualStartTime)} />
                <TimeLeftRow trip={trip} now={now} />
              </>
            ) : null}
            {trip.startOdometer != null ? (
              <DetailRow label="Start odometer" value={`${trip.startOdometer.toLocaleString('en-IN')} km`} mono />
            ) : null}
            {trip.startOdometerPhotoUrl ? (
              <View style={{ paddingVertical: spacing.sm }}>
                <ZoomableImage uri={trip.startOdometerPhotoUrl} style={styles.odoPhoto} />
              </View>
            ) : null}
            <DetailRow label="Load Provider" value={trip.loadProvider?.name ?? '—'} />
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

          {(trip.currentStatus === 'created' ? trip.startPoint : trip.endPoint)?.trim() ? (
          <Button
            variant="secondary"
            leftIcon="navigate"
            fullWidth
            onPress={() => {
              const dest = encodeURIComponent(trip.currentStatus === 'created' ? trip.startPoint : trip.endPoint);
              void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${dest}`).catch(() =>
                showToast({ type: 'error', message: 'Could not open maps' }),
              );
            }}
          >
            {trip.currentStatus === 'created' ? 'Navigate to Pickup' : 'Navigate to Drop'}
          </Button>
          ) : null}

          <View style={styles.quickRow}>
            <Button
              variant="secondary"
              leftIcon="water"
              onPress={() => router.push({ pathname: '/fuel/log', params: { tripId: trip.id } })}
              style={{ flex: 1 }}
            >
              Log Fuel
            </Button>
          </View>
        </ScrollView>
      )}

    </View>
  );
}

function TimeLeftRow({ trip, now }: { trip: Trip; now: Date }) {
  const c = useColors();
  const left = remainingMinutes(trip, now);
  if (left === null) return null;
  const over = left < 0;
  return (
    <View style={[styles.detailRow, { borderBottomColor: c.border }]}>
      <Text style={[styles.detailLabel, { color: c.textSecondary }]}>{over ? 'Overtime' : 'Time remaining'}</Text>
      <Text style={[styles.detailValue, { color: over ? st.danger : c.textPrimary }]}>{formatDuration(left)}{over ? ' over' : ''}</Text>
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
  odoPhoto: { width: '100%', height: 140, borderRadius: 8 },
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
