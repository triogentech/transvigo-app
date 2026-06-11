import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, fontSize, fontWeight, radius, spacing, status as st, useColors } from '@/theme';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth.store';
import * as ticketsApi from '@/api/tickets.api';
import * as ops from '@/api/ops.api';

type Tile = { label: string; icon: keyof typeof Ionicons.glyphMap; route: string; color: string };
const TILES: Tile[] = [
  { label: 'Tickets', icon: 'alert-circle-outline', route: '/(ops)/tickets', color: '#EA580C' },
  { label: 'Job Cards', icon: 'construct-outline', route: '/(ops)/job-cards', color: '#2563EB' },
  { label: 'Spare Parts', icon: 'cube-outline', route: '/(ops)/spare-parts', color: '#16A34A' },
  { label: 'Tyre Management', icon: 'ellipse-outline', route: '/(ops)/tyres', color: '#7C3AED' },
  { label: 'Invoices', icon: 'receipt-outline', route: '/(ops)/invoices', color: '#0EA5C5' },
  { label: 'Maintenance', icon: 'build-outline', route: '/(ops)/maintenance', color: '#D97706' },
  { label: 'Trips', icon: 'map-outline', route: '/(ops)/trips', color: brand.navy },
];

export default function OpsHub() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [openTickets, setOpenTickets] = useState<number | null>(null);
  const [onCredit, setOnCredit] = useState<number | null>(null);

  useEffect(() => {
    ticketsApi.getTicketsPage({ status: 'open', pageSize: 1 }).then((r) => setOpenTickets(r.pagination.total)).catch(() => undefined);
    ops.getInvoices().then((rows) => setOnCredit(rows.filter((i) => i.paymentStatus === 'on_credit').length)).catch(() => undefined);
  }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bgPage }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl }]}
    >
      <View style={styles.headRow}>
        <View>
          <Text style={[styles.sub, { color: c.textSecondary }]}>Operations Hub</Text>
          <Text style={[styles.title, { color: brand.navy }]}>{user?.username ?? 'Operations'}</Text>
        </View>
        <Pressable onPress={() => router.push('/notifications')} hitSlop={8} style={[styles.bell, { backgroundColor: c.bgSurface, borderColor: c.border }]}>
          <Ionicons name="notifications-outline" size={22} color={c.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.stats}>
        <Card style={styles.stat}>
          <Text style={[styles.statNum, { color: openTickets ? st.danger : c.textPrimary }]}>{openTickets ?? '—'}</Text>
          <Text style={[styles.statLabel, { color: c.textSecondary }]}>Open Tickets</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={[styles.statNum, { color: onCredit ? st.warning : c.textPrimary }]}>{onCredit ?? '—'}</Text>
          <Text style={[styles.statLabel, { color: c.textSecondary }]}>On Credit</Text>
        </Card>
      </View>

      <Text style={[styles.section, { color: c.textPrimary }]}>Modules</Text>
      <View style={styles.grid}>
        {TILES.map((t) => (
          <Pressable key={t.route} onPress={() => router.push(t.route as never)} style={[styles.tile, { backgroundColor: c.bgSurface, borderColor: c.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: `${t.color}1A` }]}>
              <Ionicons name={t.icon} size={22} color={t.color} />
            </View>
            <Text style={[styles.tileLabel, { color: c.textPrimary }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.sm },
  bell: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  sub: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  stats: { flexDirection: 'row', gap: spacing.md },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.md },
  statNum: { fontSize: fontSize.xxl, fontWeight: fontWeight.heavy },
  statLabel: { fontSize: fontSize.xs },
  section: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, marginTop: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: { width: '47%', flexGrow: 1, borderWidth: 1, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm, alignItems: 'flex-start' },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
});
