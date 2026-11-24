import { ZoomableImage } from '@/components/ui/ZoomableImage';
import { useCallback, useEffect, useState } from 'react';
import { AppState, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, fontFamily, fontSize, fontWeight, radius, spacing, status as st, useColors } from '@/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { TicketHistory } from '@/components/ticket/TicketHistory';
import { MessageThread } from '@/components/maintenance/MessageThread';
import { showToast } from '@/store/toast.store';
import * as ticketsApi from '@/api/tickets.api';
import { errMessage } from '@/api/client';
import { getSlaElapsedFraction, getSlaStatus, formatSlaCountdown, SLA_HOURS } from '@/utils/sla';
import { titleCase } from '@/utils/format';
import type { Ticket } from '@/types/api.types';
import type { ThreadMessage } from '@/types/maintenance.types';

const POLL_MS = 20_000;

export default function TicketDetailScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);

  const load = useCallback(async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [t, m] = await Promise.all([ticketsApi.getTicket(id), ticketsApi.getTicketMessages(id).catch(() => null)]);
      setTicket(t);
      if (m) setMessages(m);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Replies normally arrive by push; poll while the screen is open as a fallback (same as a maintenance report).
  useEffect(() => {
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void load(true);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const send = async (body: string): Promise<void> => {
    if (!id) return;
    try {
      await ticketsApi.postTicketMessage(id, body);
      await load(true);
    } catch (e) {
      showToast({ type: 'error', message: errMessage(e, 'Could not send the message') });
      throw e;
    }
  };

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
          <ErrorBanner message={error ?? 'Ticket not found'} onRetry={() => void load()} />
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]} keyboardShouldPersistTaps="handled">
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
            {ticket.photoUrl ? (
              <View style={{ marginTop: spacing.md }}>
                <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Photo</Text>
                <ZoomableImage uri={ticket.photoUrl} style={styles.ticketPhoto} />
              </View>
            ) : null}
          </Card>

          {ticket.assignedToUser ? <AssigneeCard assignee={ticket.assignedToUser} /> : null}

          <Text style={[styles.fieldLabel, { color: c.textTertiary, letterSpacing: 0.8, marginTop: spacing.sm }]}>CONVERSATION</Text>
          <MessageThread
            messages={messages}
            viewer="driver"
            closedNote={ticket.status === 'resolved' || ticket.status === 'closed' ? 'This ticket is resolved. Raise a new report if the problem comes back.' : undefined}
            onSend={send}
          />

          <Card>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Ticket Journey</Text>
            <TicketHistory entries={ticket.history ?? []} />
          </Card>
        </ScrollView>
        </KeyboardAvoidingView>
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

function AssigneeCard({ assignee }: { assignee: NonNullable<Ticket['assignedToUser']> }) {
  const c = useColors();
  const name = assignee.staff?.fullName ?? assignee.username;
  const phone = assignee.staff ? `${assignee.staff.countryDialCode}${assignee.staff.contactNumber}` : null;
  const email = assignee.email ?? null;
  const digits = phone ? phone.replace(/[^0-9]/g, '') : '';
  return (
    <Card style={{ gap: spacing.sm }}>
      <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Assigned To</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={[styles.assigneeAvatar, { backgroundColor: brand.navy }]}>
          <Ionicons name="person" size={18} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.textPrimary, fontSize: fontSize.md, fontWeight: fontWeight.semibold }}>{name}</Text>
          {email ? <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>{email}</Text> : null}
          {phone ? <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>{phone}</Text> : null}
        </View>
      </View>
      {phone || email ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {phone ? <ContactBtn icon="call" label="Call" color={st.success} onPress={() => void Linking.openURL(`tel:${phone}`)} /> : null}
          {phone ? <ContactBtn icon="logo-whatsapp" label="WhatsApp" color="#25D366" onPress={() => void Linking.openURL(`https://wa.me/${digits}`)} /> : null}
          {email ? <ContactBtn icon="mail" label="Email" color={brand.teal} onPress={() => void Linking.openURL(`mailto:${email}`)} /> : null}
        </View>
      ) : (
        <Text style={{ color: c.textTertiary, fontSize: fontSize.sm }}>No contact details available.</Text>
      )}
    </Card>
  );
}

function ContactBtn({ icon, label, color, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.contactBtn, { backgroundColor: `${color}1A`, borderColor: `${color}33` }]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={{ color, fontSize: fontSize.sm, fontWeight: fontWeight.semibold }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ticketPhoto: { width: '100%', height: 200, borderRadius: 10, marginTop: 6 },
  assigneeAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1 },
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
