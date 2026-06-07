import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontFamily, fontSize, fontWeight, radius, spacing, status as st, useColors } from '@/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { TicketHistory } from '@/components/ticket/TicketHistory';
import * as ticketsApi from '@/api/tickets.api';
import { errMessage } from '@/api/client';
import { getSlaElapsedFraction, getSlaStatus, formatSlaCountdown, SLA_HOURS } from '@/utils/sla';
import { titleCase } from '@/utils/format';
import type { Ticket } from '@/types/api.types';

export default function TicketDetailScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setTicket(await ticketsApi.getTicket(id));
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <ScreenHeader title={ticket ? ticket.ticketNumber : 'Ticket'} />

      {loading ? (
        <View style={styles.content}>
          <Skeleton height={140} />
          <Skeleton height={120} style={{ marginTop: spacing.md }} />
        </View>
      ) : error || !ticket ? (
        <View style={styles.content}>
          <ErrorBanner message={error ?? 'Ticket not found'} onRetry={load} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}>
          <Card style={styles.gap}>
            <View style={styles.badgeRow}>
              <StatusBadge status={ticket.priority} variant="priority" />
              <StatusBadge status={ticket.status} variant="ticket" />
            </View>
            <Text style={[styles.title, { color: c.textPrimary }]}>{ticket.title}</Text>
            <SlaBar ticket={ticket} />
          </Card>

          <Card style={styles.gap}>
            <DetailRow label="Issue Type" value={titleCase(ticket.issueType)} />
            {ticket.vehicle ? <DetailRow label="Vehicle" value={ticket.vehicle.vehicleNumber} mono /> : null}
            {ticket.location ? <DetailRow label="Location" value={ticket.location} /> : null}
            <View style={{ marginTop: spacing.sm }}>
              <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Description</Text>
              <Text style={[styles.body, { color: c.textPrimary }]}>{ticket.description}</Text>
            </View>
            {ticket.resolution ? (
              <View style={{ marginTop: spacing.md }}>
                <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Resolution</Text>
                <Text style={[styles.body, { color: c.textPrimary }]}>{ticket.resolution}</Text>
              </View>
            ) : null}
          </Card>

          <Card>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Ticket Journey</Text>
            <TicketHistory entries={ticket.history ?? []} />
          </Card>
        </ScrollView>
      )}
    </View>
  );
}

function SlaBar({ ticket }: { ticket: Ticket }) {
  const c = useColors();
  const resolved = Boolean(ticket.resolvedAt);
  const slaStatus = getSlaStatus(ticket.openedAt, ticket.priority, ticket.resolvedAt ?? undefined);
  const fraction = resolved ? 1 : getSlaElapsedFraction(ticket.openedAt, ticket.priority);
  const color =
    slaStatus === 'breached' || slaStatus === 'resolved_late'
      ? st.danger
      : slaStatus === 'at_risk'
        ? st.warning
        : st.success;
  const elapsedHours = Math.round(SLA_HOURS[ticket.priority] * fraction);

  return (
    <View style={styles.slaWrap}>
      <View style={[styles.track, { backgroundColor: c.bgSunken }]}>
        <View style={[styles.fill, { width: `${Math.round(fraction * 100)}%`, backgroundColor: color }]} />
      </View>
      <View style={styles.slaTextRow}>
        <Text style={[styles.slaMeta, { color: c.textTertiary }]}>
          {elapsedHours}h of {ticket.allottedTimeHours}h
        </Text>
        <Text style={[styles.slaStatus, { color }]}>
          {resolved
            ? slaStatus === 'resolved_on_time'
              ? 'Resolved on time'
              : 'Resolved late'
            : formatSlaCountdown(ticket.openedAt, ticket.priority)}
        </Text>
      </View>
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
  gap: { gap: spacing.sm },
  badgeRow: { flexDirection: 'row', gap: spacing.sm },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  slaWrap: { marginTop: spacing.sm, gap: spacing.xs },
  track: { height: 8, borderRadius: radius.full, overflow: 'hidden' },
  fill: { height: 8, borderRadius: radius.full },
  slaTextRow: { flexDirection: 'row', justifyContent: 'space-between' },
  slaMeta: { fontSize: fontSize.xs },
  slaStatus: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailLabel: { fontSize: fontSize.sm },
  detailValue: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  fieldLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, marginBottom: 2 },
  body: { fontSize: fontSize.md, lineHeight: fontSize.md * 1.45 },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: spacing.md },
});
