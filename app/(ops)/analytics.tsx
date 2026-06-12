import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, fontSize, fontWeight, radius, spacing, status as st, useColors } from '@/theme';
import { Card } from '@/components/ui/Card';
import * as ops from '@/api/ops.api';
import type { InvoiceAnalytics, SpareAnalytics } from '@/types/ops.types';

const inr = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`;

export default function OpsAnalytics() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [inv, setInv] = useState<InvoiceAnalytics | null>(null);
  const [spare, setSpare] = useState<SpareAnalytics | null>(null);

  useEffect(() => {
    ops.getInvoiceAnalytics().then(setInv).catch(() => undefined);
    ops.getSpareAnalytics().then(setSpare).catch(() => undefined);
  }, []);

  const maxVendor = Math.max(1, ...(inv?.vendors ?? []).map((v) => v.spend));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bgPage }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl }]}
    >
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} hitSlop={8}><Ionicons name="chevron-back" size={24} color={c.textPrimary} /></Pressable>
        <Text style={[styles.title, { color: brand.navy }]}>Analytics</Text>
      </View>

      {/* ── Invoice spend ── */}
      <Text style={[styles.section, { color: c.textPrimary }]}>Invoice Spend</Text>
      <Card style={styles.stat}>
        <View style={styles.iconRow}>
          <Ionicons name="trending-up" size={16} color={st.info} />
          <Text style={[styles.statLabel, { color: c.textSecondary }]}>TOTAL SPEND</Text>
        </View>
        <Text style={[styles.statBig, { color: c.textPrimary }]}>{inr(inv?.totalSpend ?? 0)}</Text>
        <View style={[styles.divider, { backgroundColor: c.border }]} />
        <Text style={[styles.statLabel, { color: st.danger }]}>TOTAL CREDIT DUE</Text>
        <Text style={[styles.statMid, { color: c.textPrimary }]}>{inr(inv?.totalCreditDue ?? 0)}</Text>
      </Card>

      <Text style={[styles.subSection, { color: st.warning }]}>VENDOR CREDIT ANALYSIS</Text>
      {(inv?.vendors ?? []).map((v, i) => (
        <Card key={i} style={styles.vCard}>
          <Text style={[styles.vName, { color: c.textSecondary }]}>{v.vendorName.toUpperCase()}</Text>
          <View style={styles.vRow}>
            <Text style={[styles.vSpend, { color: c.textPrimary }]}>{inr(v.spend)}</Text>
            <View style={[styles.pill, { borderColor: v.creditDue > 0 ? st.danger : c.border }]}>
              <Text style={{ color: v.creditDue > 0 ? st.danger : c.textTertiary, fontSize: fontSize.xs, fontWeight: fontWeight.semibold }}>Credit: {inr(v.creditDue)}</Text>
            </View>
          </View>
          <View style={[styles.bar, { backgroundColor: c.bgSunken }]}>
            <View style={{ width: `${Math.round((v.spend / maxVendor) * 100)}%`, height: '100%', backgroundColor: st.warning }} />
          </View>
        </Card>
      ))}
      {(inv?.vendors ?? []).length === 0 && <Text style={[styles.empty, { color: c.textTertiary }]}>No invoices yet.</Text>}

      {/* ── Spare-part spend ── */}
      <Text style={[styles.section, { color: c.textPrimary, marginTop: spacing.lg }]}>Spare-Part Spend</Text>
      <Card style={styles.stat}>
        <View style={styles.iconRow}>
          <Ionicons name="cube" size={16} color={st.success} />
          <Text style={[styles.statLabel, { color: c.textSecondary }]}>MAJOR PART SPEND</Text>
        </View>
        <Text style={[styles.statBig, { color: c.textPrimary }]}>{inr(spare?.majorPartSpend ?? 0)}</Text>
        <Text style={[styles.note, { color: c.textTertiary }]}>System-indexed spare part slips.</Text>
      </Card>

      <Text style={[styles.subSection, { color: st.info }]}>REPETITIVE & COSTLY BUYS</Text>
      {(spare?.parts ?? []).map((pt, i) => (
        <Card key={i} style={styles.vCard}>
          <Text style={[styles.vName, { color: c.textSecondary }]}>{pt.partName.toUpperCase()}</Text>
          <View style={styles.vRow}>
            <Text style={[styles.vSpend, { color: c.textPrimary }]}>{inr(pt.cost)}</Text>
            <View style={[styles.pill, { borderColor: c.border }]}>
              <Text style={{ color: st.info, fontSize: fontSize.xs, fontWeight: fontWeight.semibold }}>Qty: {pt.qty}</Text>
            </View>
          </View>
        </Card>
      ))}
      {(spare?.parts ?? []).length === 0 && <Text style={[styles.empty, { color: c.textTertiary }]}>No spare-part slips yet.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  section: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, marginTop: spacing.xs },
  subSection: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, letterSpacing: 0.5, marginTop: spacing.sm },
  stat: { gap: 2 },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, letterSpacing: 0.5 },
  statBig: { fontSize: fontSize.xxl, fontWeight: fontWeight.heavy },
  statMid: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  divider: { height: 1, marginVertical: spacing.sm },
  note: { fontSize: fontSize.xs, fontStyle: 'italic', marginTop: 2 },
  vCard: { gap: spacing.xs },
  vName: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, letterSpacing: 0.5 },
  vRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  vSpend: { fontSize: fontSize.lg, fontWeight: fontWeight.heavy },
  pill: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  bar: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: spacing.xs },
  empty: { fontSize: fontSize.sm, paddingVertical: spacing.sm },
});
