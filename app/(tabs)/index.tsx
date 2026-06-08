import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, fontFamily, fontSize, fontWeight, radius, spacing, status as st, useColors } from '@/theme';
import { Button } from '@/components/ui/Button';
import { ActiveTripBanner } from '@/components/home/ActiveTripBanner';
import { QuickActions } from '@/components/home/QuickActions';
import { AlertsPanel } from '@/components/home/AlertsPanel';
import { ConfirmBottomSheet } from '@/components/ui/ConfirmBottomSheet';
import { useActiveTrip } from '@/hooks/useActiveTrip';
import { useAuthStore } from '@/store/auth.store';
import * as ticketsApi from '@/api/tickets.api';
import * as driverApi from '@/api/driver.api';
import { getSlaStatus, getSlaDeadline } from '@/utils/sla';
import type { DriverAlert, DriverMe, Ticket, TicketPriority } from '@/types/api.types';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function buildAlerts(tickets: Ticket[]): DriverAlert[] {
  const alerts: DriverAlert[] = [];
  for (const t of tickets) {
    if (t.status === 'resolved' || t.status === 'closed') continue;
    if (t.priority === 'critical') {
      alerts.push({
        type: 'critical_ticket',
        severity: 'danger',
        title: `CRITICAL: ${t.title}`,
        message: t.title,
        linkType: 'ticket',
        linkId: t.id,
      });
    }
  }
  return alerts.slice(0, 3);
}

// Priority → accent colour + soft tint for the icon tile.
const PRI_ACCENT: Record<TicketPriority, string> = {
  critical: st.danger,
  high: '#EA580C',
  medium: st.warning,
  low: '#9CA3AF',
};
const PRI_TINT: Record<TicketPriority, string> = {
  critical: st.dangerBg,
  high: '#FEF1E6',
  medium: st.warningBg,
  low: '#F3F4F6',
};

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Live HH:MM:SS SLA countdown; turns amber/red as the deadline nears/passes. */
function SlaCountdown({ openedAt, priority }: { openedAt: string; priority: TicketPriority }) {
  const c = useColors();
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const remMs = getSlaDeadline(openedAt, priority).getTime() - now.getTime();
  const overdue = remMs < 0;
  const totalSec = Math.floor(Math.abs(remMs) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  const status = getSlaStatus(openedAt, priority, undefined, now);
  const color = overdue || status === 'breached' ? st.danger : status === 'at_risk' ? st.warning : c.textPrimary;

  return (
    <Text style={[styles.slaValue, { color }]}>
      {overdue ? '-' : ''}{pad2(h)}:{pad2(m)}:{pad2(s)}
    </Text>
  );
}

function RecentTicketRow({ ticket, onPress }: { ticket: Ticket; onPress: () => void }) {
  const c = useColors();
  const accent = PRI_ACCENT[ticket.priority];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.ticketRow, { backgroundColor: c.bgCard, borderColor: c.border, opacity: pressed ? 0.9 : 1 }]}
    >
      <View style={[styles.ticketIcon, { backgroundColor: PRI_TINT[ticket.priority] }]}>
        <Ionicons name="construct" size={20} color={accent} />
      </View>
      <View style={styles.ticketBody}>
        <Text style={[styles.ticketTitle, { color: c.textPrimary }]} numberOfLines={1}>
          {ticket.title}
        </Text>
        <Text style={[styles.ticketPriority, { color: accent }]}>{ticket.priority.toUpperCase()} PRIORITY</Text>
      </View>
      <View style={styles.ticketSla}>
        <Text style={[styles.slaLabel, { color: c.textTertiary }]}>SLA</Text>
        <SlaCountdown openedAt={ticket.openedAt} priority={ticket.priority} />
      </View>
    </Pressable>
  );
}

function EmptyTripCard({ onCheck, loading }: { onCheck: () => void; loading: boolean }) {
  const c = useColors();
  return (
    <View style={[styles.emptyCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
      <View style={styles.truckCircle}>
        <MaterialCommunityIcons name="truck" size={30} color={brand.navy} />
      </View>
      <Text style={[styles.emptyTitle, { color: c.textPrimary }]}>Ready to Roll?</Text>
      <Text style={[styles.emptySub, { color: c.textSecondary }]}>
        You haven&apos;t been assigned any trips for today yet.
      </Text>
      <Button variant="primary" size="lg" fullWidth loading={loading} onPress={onCheck}>
        Check for Assignments
      </Button>
    </View>
  );
}

export default function HomeScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { activeTrip, updateStatus, refresh } = useActiveTrip();

  const [openTickets, setOpenTickets] = useState<Ticket[]>([]);
  const [me, setMe] = useState<DriverMe | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);

  const loadTickets = useCallback(async () => {
    try {
      const res = await ticketsApi.getTicketsPage({ status: 'open', pageSize: 10 });
      setOpenTickets(res.data);
    } catch {
      // best-effort; Home stays usable without it
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  // Fetch the driver profile for the greeting name (auth user only has username).
  useEffect(() => {
    let active = true;
    driverApi
      .getDriverMe()
      .then((data) => {
        if (active) setMe(data);
      })
      .catch(() => {
        // best-effort; fall back to username/'Driver' below
      });
    return () => {
      active = false;
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadTickets(), refresh()]);
    setRefreshing(false);
  }, [loadTickets, refresh]);

  const onCheckAssignments = useCallback(async () => {
    setChecking(true);
    await refresh();
    setChecking(false);
  }, [refresh]);

  const alerts = buildAlerts(openTickets);
  const hasCritical = openTickets.some((t) => t.priority === 'critical');
  // Prefer the driver's real name; fall back to the login username, then a generic label.
  const name = me?.driver?.fullName ?? user?.username ?? 'Driver';

  const goAlert = (a: DriverAlert): void => {
    if (a.linkType === 'ticket' && a.linkId) router.push(`/ticket/${a.linkId}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand.navy} />}
      >
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingBlock}>
            <Text style={[styles.greetingSub, { color: c.textSecondary }]}>{greeting()},</Text>
            <Text style={[styles.greetingName, { color: brand.navy }]}>{name}</Text>
          </View>
          <Pressable onPress={() => router.push('/notifications')} hitSlop={8} style={[styles.bell, { backgroundColor: c.bgSurface, borderColor: c.border }]}>
            <Ionicons name="notifications-outline" size={22} color={c.textPrimary} />
          </Pressable>
        </View>

        {/* Active trip / empty state */}
        {activeTrip ? (
          <ActiveTripBanner
            trip={activeTrip}
            onComplete={() => setConfirmComplete(true)}
            onPress={() => router.push(`/trip/${activeTrip.id}`)}
          />
        ) : (
          <EmptyTripCard onCheck={onCheckAssignments} loading={checking} />
        )}

        {/* Alerts (only when present) */}
        <AlertsPanel alerts={alerts} onPressAlert={goAlert} />

        {/* Recent tickets */}
        {openTickets.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: c.textTertiary }]}>RECENT TICKETS</Text>
              <Pressable onPress={() => router.push('/(tabs)/tickets')} hitSlop={8}>
                <Text style={[styles.viewAll, { color: brand.teal }]}>View All</Text>
              </Pressable>
            </View>
            {openTickets.slice(0, 3).map((t) => (
              <RecentTicketRow key={t.id} ticket={t} onPress={() => router.push(`/ticket/${t.id}`)} />
            ))}
          </View>
        ) : null}

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textTertiary }]}>QUICK ACTIONS</Text>
          <QuickActions
            onReportIssue={() => router.push('/ticket/new')}
            onLogFuel={() => router.push('/fuel/log')}
            onLogToll={() => router.push('/toll/log')}
            onMyTrips={() => router.push('/(tabs)/trips')}
            hasCriticalTicket={hasCritical}
          />
        </View>
      </ScrollView>

      <ConfirmBottomSheet
        visible={confirmComplete}
        onClose={() => setConfirmComplete(false)}
        onConfirm={() => {
          setConfirmComplete(false);
          void updateStatus('completed');
        }}
        title="Complete trip?"
        message="Mark this trip as completed. This confirms you've arrived at the destination."
        confirmLabel="Complete Trip"
      />
    </View>
  );
}

const cardShadow = {
  shadowColor: '#1B2D6B',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
} as const;

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.xl },

  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bell: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  greetingBlock: { gap: 2 },
  greetingSub: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
  greetingName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },

  // Empty trip card
  emptyCard: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    ...cardShadow,
  },
  truckCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EEF1FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  emptySub: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20, marginBottom: spacing.md },

  // Sections
  section: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 0.8 },
  viewAll: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },

  // Recent ticket row
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...cardShadow,
  },
  ticketIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ticketBody: { flex: 1, gap: 2 },
  ticketTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  ticketPriority: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 0.3 },
  ticketSla: { alignItems: 'flex-end' },
  slaLabel: { fontSize: 9, fontWeight: fontWeight.semibold, letterSpacing: 0.5 },
  slaValue: { fontFamily: fontFamily.mono, fontSize: fontSize.md, fontWeight: fontWeight.bold },
});
