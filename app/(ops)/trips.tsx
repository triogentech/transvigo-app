import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontSize, fontWeight, radius, spacing, useColors } from '@/theme';
import { Card } from '@/components/ui/Card';
import { OpsListScaffold } from '@/components/ops/OpsListScaffold';
import { useOpsList } from '@/hooks/useOpsList';
import * as tripsApi from '@/api/trips.api';
import type { Trip } from '@/types/api.types';

const STATUS_COLOR: Record<string, string> = { created: '#9CA3AF', in_transit: '#0EA5C5', completed: '#16A34A' };
const fetchTrips = async (): Promise<Trip[]> => {
  const res = await tripsApi.getTripsPage({ page: 1, pageSize: 100 });
  return res.trips;
};

export default function OpsTrips() {
  const c = useColors();
  const { items, loading, error, reload } = useOpsList(useCallback(fetchTrips, []));
  return (
    <OpsListScaffold title="Trips" loading={loading} error={error} empty={items.length === 0} onRefresh={reload}>
      {items.map((t) => {
        const color = STATUS_COLOR[t.currentStatus] ?? '#9CA3AF';
        return (
          <Card key={t.id} style={styles.card} accentColor={color}>
            <View style={styles.row}>
              <Text style={[styles.num, { color: c.textPrimary }]}>{t.tripNumber}</Text>
              <View style={[styles.pill, { backgroundColor: `${color}1A` }]}>
                <Text style={{ color, fontSize: fontSize.xs, fontWeight: fontWeight.semibold }}>{t.currentStatus.replace('_', ' ')}</Text>
              </View>
            </View>
            <Text style={[styles.route, { color: c.textPrimary }]} numberOfLines={1}>{t.startPoint} → {t.endPoint}</Text>
            <Text style={[styles.meta, { color: c.textSecondary }]}>{t.vehicle?.vehicleNumber ?? '—'} · {t.driver?.fullName ?? 'Unassigned'}</Text>
          </Card>
        );
      })}
    </OpsListScaffold>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  num: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  route: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  meta: { fontSize: fontSize.sm },
});
