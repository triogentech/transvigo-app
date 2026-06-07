import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brand, fontSize, fontWeight, spacing, status as st, useColors } from '@/theme';
import type { TripStatus } from '@/types/api.types';

const STEPS: { key: TripStatus; label: string }[] = [
  { key: 'created', label: 'Created' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'completed', label: 'Completed' },
];

const INDEX: Record<TripStatus, number> = { created: 0, in_transit: 1, completed: 2 };

export function TripStatusStepper({ status }: { status: TripStatus }) {
  const c = useColors();
  const current = INDEX[status];

  return (
    <View style={styles.container}>
      {STEPS.map((step, i) => {
        const done = i <= current;
        const isCurrent = i === current;
        const dotColor = done ? brand.teal : c.border;
        return (
          <View key={step.key} style={styles.step}>
            <View style={styles.lineRow}>
              {i > 0 ? (
                <View style={[styles.line, { backgroundColor: i <= current ? brand.teal : c.border }]} />
              ) : (
                <View style={styles.line} />
              )}
              <View style={[styles.dot, { backgroundColor: dotColor, borderColor: isCurrent ? brand.navy : dotColor }]}>
                {done ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
              </View>
              {i < STEPS.length - 1 ? (
                <View style={[styles.line, { backgroundColor: i < current ? brand.teal : c.border }]} />
              ) : (
                <View style={styles.line} />
              )}
            </View>
            <Text
              style={[
                styles.label,
                { color: done ? c.textPrimary : c.textTertiary, fontWeight: isCurrent ? fontWeight.bold : fontWeight.regular },
              ]}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start' },
  step: { flex: 1, alignItems: 'center' },
  lineRow: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center' },
  line: { flex: 1, height: 2 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: fontSize.xs, marginTop: spacing.xs, textAlign: 'center' },
});
