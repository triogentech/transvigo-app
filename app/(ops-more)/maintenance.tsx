import { StyleSheet, Text, View } from 'react-native';
import { fontSize, fontWeight, spacing, useColors } from '@/theme';
import { Card } from '@/components/ui/Card';
import { OpsListScaffold } from '@/components/ops/OpsListScaffold';
import { useOpsList } from '@/hooks/useOpsList';
import * as ops from '@/api/ops.api';

const fmt = (s?: string | null) => (s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—');

export default function OpsMaintenance() {
  const c = useColors();
  const { items, loading, error, reload } = useOpsList(ops.getGarageLogs);
  return (
    <OpsListScaffold title="Maintenance" loading={loading} error={error} empty={items.length === 0} onRefresh={reload}>
      {items.map((g) => (
        <Card key={g.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={[styles.veh, { color: c.textPrimary }]}>{g.vehicle?.vehicleNumber ?? '—'}</Text>
            <Text style={[styles.cost, { color: c.textSecondary }]}>{g.totalCost != null ? `₹${Number(g.totalCost).toLocaleString('en-IN')}` : ''}</Text>
          </View>
          <Text style={[styles.meta, { color: c.textSecondary }]}>{g.garage?.name ?? 'Garage'} · {fmt(g.serviceDate ?? g.createdAt)}</Text>
          {g.description ? <Text style={[styles.desc, { color: c.textPrimary }]} numberOfLines={2}>{g.description}</Text> : null}
        </Card>
      ))}
    </OpsListScaffold>
  );
}

const styles = StyleSheet.create({
  card: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  veh: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  cost: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  meta: { fontSize: fontSize.sm },
  desc: { fontSize: fontSize.sm, marginTop: spacing.xs },
});
