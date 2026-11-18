import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brand, fontFamily, fontSize, fontWeight, radius, spacing, useColors } from '@/theme';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatRelativeTime } from '@/utils/format';
import { formatDuration, remainingMinutes, useNow } from '@/utils/trip-time';
import type { Trip } from '@/types/api.types';

interface ActiveTripBannerProps {
  trip: Trip;
  onComplete: () => void;
  onPress: () => void;
}

/** The driver's current trip: in transit (Complete) or assigned and waiting to start (Open to start). */
export function ActiveTripBanner({ trip, onComplete, onPress }: ActiveTripBannerProps) {
  const c = useColors();
  const inTransit = trip.currentStatus === 'in_transit';
  const left = remainingMinutes(trip, useNow());
  return (
    <View style={[styles.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
      <Pressable onPress={onPress}>
        <View style={styles.headerRow}>
          <Text style={[styles.number, { color: brand.teal }]}>{trip.tripNumber}</Text>
          <StatusBadge status={trip.currentStatus} variant="trip" />
        </View>

        <View style={styles.routeBlock}>
          <View style={styles.routeRow}>
            <Ionicons name="ellipse" size={12} color={brand.teal} />
            <Text style={[styles.point, { color: c.textPrimary }]} numberOfLines={1}>
              {trip.startPoint}
            </Text>
          </View>
          <View style={[styles.connector, { backgroundColor: c.border }]} />
          <View style={styles.routeRow}>
            <Ionicons name="location" size={14} color={brand.navy} />
            <Text style={[styles.point, { color: c.textPrimary }]} numberOfLines={1}>
              {trip.endPoint}
            </Text>
          </View>
        </View>

        {left !== null ? (
          <Text style={[styles.eta, { color: left < 0 ? '#DC2626' : c.textSecondary }]}>
            {left < 0 ? `Overtime ${formatDuration(left)}` : `${formatDuration(left)} left of allocated time`}
          </Text>
        ) : (
          <Text style={[styles.eta, { color: c.textSecondary }]}>
            {inTransit
              ? `Arrives ${formatRelativeTime(trip.estimatedEndTime)}`
              : `Starts ${formatRelativeTime(trip.estimatedStartTime)}`}
          </Text>
        )}
      </Pressable>

      <Button variant="primary" size="lg" fullWidth onPress={inTransit ? onComplete : onPress} leftIcon={inTransit ? 'checkmark-circle' : 'play'}>
        {inTransit ? 'Complete Trip' : 'Open & Start Trip'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderTopWidth: 4,
    borderTopColor: brand.teal,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  number: { fontFamily: fontFamily.mono, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  routeBlock: { marginTop: spacing.sm },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  connector: { width: 2, height: 16, marginLeft: 5, marginVertical: 2 },
  point: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, flex: 1 },
  eta: { fontSize: fontSize.sm },
});
