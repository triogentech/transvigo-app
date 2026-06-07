import { StyleSheet, Text, View } from 'react-native';
import { brand, fontSize, fontWeight, spacing, status as st, useColors } from '@/theme';
import { formatDateTime } from '@/utils/format';
import type { TicketHistoryEntry, TicketStatus } from '@/types/api.types';

const DOT: Record<TicketStatus, string> = {
  open: st.info,
  acknowledged: st.info,
  in_progress: brand.teal,
  resolved: st.success,
  closed: '#9CA3AF',
};

export function TicketHistory({ entries }: { entries: TicketHistoryEntry[] }) {
  const c = useColors();
  // Chronological, oldest → newest (backend sends newest first).
  const ordered = [...entries].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  if (ordered.length === 0) {
    return <Text style={[styles.empty, { color: c.textTertiary }]}>No history yet</Text>;
  }

  return (
    <View>
      {ordered.map((e, i) => {
        const dotColor = e.toStatus ? DOT[e.toStatus] : brand.navy;
        const isLast = i === ordered.length - 1;
        return (
          <View key={e.id} style={styles.row}>
            <View style={styles.gutter}>
              <View style={[styles.dot, { backgroundColor: dotColor }]} />
              {!isLast ? <View style={[styles.line, { backgroundColor: c.border }]} /> : null}
            </View>
            <View style={styles.content}>
              <Text style={[styles.action, { color: c.textPrimary }]}>
                {e.fromStatus && e.toStatus ? `${labelOf(e.fromStatus)} → ${labelOf(e.toStatus)}` : prettyAction(e.action)}
              </Text>
              <Text style={[styles.meta, { color: c.textTertiary }]}>
                {(e.performedByUser?.username ?? 'System') + ' · ' + formatDateTime(e.createdAt)}
              </Text>
              {e.note ? <Text style={[styles.note, { color: c.textSecondary }]}>{e.note}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function labelOf(s: TicketStatus): string {
  return s.replace('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}
function prettyAction(a: string): string {
  return a.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  gutter: { width: 20, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  line: { width: 2, flex: 1, marginTop: 2 },
  content: { flex: 1, paddingBottom: spacing.lg, paddingLeft: spacing.sm },
  action: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  meta: { fontSize: fontSize.xs, marginTop: 2 },
  note: { fontSize: fontSize.sm, marginTop: spacing.xs },
  empty: { fontSize: fontSize.sm, paddingVertical: spacing.md },
});
