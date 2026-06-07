import { StyleSheet, Text, View } from 'react-native';
import { brand, fontFamily, fontSize, fontWeight, spacing, status, useColors } from '@/theme';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatRelativeTime, getTripRoute } from '@/utils/format';
import type { Trip } from '@/types/api.types';

const ACCENT: Record<Trip['currentStatus'], string> = {
  created: '#9CA3AF',
  in_transit: brand.teal,
  completed: status.success,
};

export function TripCard({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const c = useColors();
  return (
    <Card onPress={onPress} accentColor={ACCENT[trip.currentStatus]} style={styles.card}>
      <View style={styles.row}>
        <Text style={[styles.number, { color: brand.teal }]}>{trip.tripNumber}</Text>
        <StatusBadge status={trip.currentStatus} variant="trip" />
      </View>

      <Text style={[styles.route, { color: c.textPrimary }]} numberOfLines={1}>
        {getTripRoute(trip)}
      </Text>

      <View style={styles.metaRow}>
        {trip.vehicle ? (
          <View style={[styles.pill, { backgroundColor: c.bgSunken }]}>
            <Text style={[styles.pillText, { color: c.textSecondary }]}>{trip.vehicle.vehicleNumber}</Text>
          </View>
        ) : null}
        {trip.loadProvider ? (
          <Text style={[styles.provider, { color: c.textSecondary }]} numberOfLines={1}>
            {trip.loadProvider.name}
          </Text>
        ) : null}
      </View>

      <View style={styles.row}>
        <Text style={[styles.date, { color: c.textTertiary }]}>{formatRelativeTime(trip.createdAt)}</Text>
        <Text style={[styles.amount, { color: c.textPrimary }]}>{formatCurrency(trip.freightTotalAmount)}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  number: { fontFamily: fontFamily.mono, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  route: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 6 },
  pillText: { fontSize: fontSize.xs, fontFamily: fontFamily.mono },
  provider: { fontSize: fontSize.sm, flex: 1 },
  date: { fontSize: fontSize.xs },
  amount: { fontFamily: fontFamily.mono, fontSize: fontSize.md, fontWeight: fontWeight.bold },
});
