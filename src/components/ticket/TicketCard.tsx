import { StyleSheet, Text, View } from 'react-native';
import { fontFamily, fontSize, fontWeight, spacing, status as st, useColors } from '@/theme';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TicketSlaTimer } from './TicketSlaTimer';
import { formatRelativeTime, titleCase } from '@/utils/format';
import type { Ticket } from '@/types/api.types';

const ACCENT: Record<Ticket['priority'], string> = {
  critical: st.danger,
  high: '#EA580C',
  medium: st.warning,
  low: '#9CA3AF',
};

export function TicketCard({ ticket, onPress }: { ticket: Ticket; onPress: () => void }) {
  const c = useColors();
  return (
    <Card onPress={onPress} accentColor={ACCENT[ticket.priority]} style={styles.card}>
      <View style={styles.row}>
        <Text style={[styles.number, { color: c.textSecondary }]}>{ticket.ticketNumber}</Text>
        <View style={styles.badges}>
          <StatusBadge status={ticket.priority} variant="priority" />
          <StatusBadge status={ticket.status} variant="ticket" />
        </View>
      </View>

      <Text style={[styles.title, { color: c.textPrimary }]} numberOfLines={2}>
        {ticket.title}
      </Text>

      <View style={styles.metaRow}>
        <View style={[styles.pill, { backgroundColor: c.bgSunken }]}>
          <Text style={[styles.pillText, { color: c.textSecondary }]}>{titleCase(ticket.issueType)}</Text>
        </View>
        {ticket.vehicle ? (
          <Text style={[styles.vehicle, { color: c.textSecondary }]}>{ticket.vehicle.vehicleNumber}</Text>
        ) : null}
      </View>

      <View style={styles.row}>
        <TicketSlaTimer openedAt={ticket.openedAt} priority={ticket.priority} resolvedAt={ticket.resolvedAt} />
        <Text style={[styles.opened, { color: c.textTertiary }]}>{formatRelativeTime(ticket.openedAt)}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  number: { fontFamily: fontFamily.mono, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  badges: { flexDirection: 'row', gap: spacing.xs },
  title: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 6 },
  pillText: { fontSize: fontSize.xs },
  vehicle: { fontSize: fontSize.sm, fontFamily: fontFamily.mono },
  opened: { fontSize: fontSize.xs },
});
