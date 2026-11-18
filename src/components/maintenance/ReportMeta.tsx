import { StyleSheet, Text, View } from 'react-native';
import { fontSize, fontWeight, radius, spacing } from '@/theme';
import { PRIORITY, RESPONSE, slaText } from '@/utils/maintenance';
import { useNow } from '@/utils/trip-time';
import type { AckSla, Priority, ResponseStatus } from '@/types/maintenance.types';

export function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: `${color}22` }]}>
      <Text style={{ color, fontSize: fontSize.xs, fontWeight: fontWeight.semibold }}>{label}</Text>
    </View>
  );
}

/** Priority + status pills and the live reply-SLA line for a report / job card. */
export function ReportMeta({ priority, responseStatus, sla }: { priority?: Priority; responseStatus?: ResponseStatus; sla?: AckSla | null }) {
  const now = useNow();
  const s = slaText(sla, now);
  return (
    <View style={{ gap: spacing.xs }}>
      <View style={styles.row}>
        {priority ? <Pill label={PRIORITY[priority].label} color={PRIORITY[priority].color} /> : null}
        {responseStatus ? <Pill label={RESPONSE[responseStatus].label} color={RESPONSE[responseStatus].color} /> : null}
      </View>
      {s ? <Text style={{ color: s.color, fontSize: fontSize.xs, fontWeight: fontWeight.semibold }}>{s.text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
});
