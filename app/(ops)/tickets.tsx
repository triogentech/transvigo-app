import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontSize, fontWeight, radius, spacing, useColors } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { OpsListScaffold } from '@/components/ops/OpsListScaffold';
import { useOpsList } from '@/hooks/useOpsList';
import { showToast } from '@/store/toast.store';
import { errMessage, api } from '@/api/client';
import * as ops from '@/api/ops.api';
import type { Paginated, Ticket, TicketStatus } from '@/types/api.types';
import type { SelectOption } from '@/types/ops.types';

const STATUS: Record<TicketStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: '#2563EB' },
  acknowledged: { label: 'Acknowledged', color: '#0EA5C5' },
  in_progress: { label: 'In Progress', color: '#D97706' },
  resolved: { label: 'Resolved', color: '#16A34A' },
  closed: { label: 'Closed', color: '#9CA3AF' },
};
const STATUS_OPTS: SelectOption[] = (Object.keys(STATUS) as TicketStatus[]).map((s) => ({ value: s, label: STATUS[s].label }));
const PRIORITY_COLOR: Record<string, string> = { critical: '#DC2626', high: '#EA580C', medium: '#D97706', low: '#9CA3AF' };

const fetchTickets = async (): Promise<Ticket[]> => {
  const res = await api.get<Paginated<Ticket>>('/api/tickets', { params: { page: 1, pageSize: 100 } });
  return res.data.data;
};

export default function OpsTickets() {
  const c = useColors();
  const { items, loading, error, reload } = useOpsList(fetchTickets);
  const [assignees, setAssignees] = useState<SelectOption[]>([]);

  useEffect(() => { ops.getAssignees().then(setAssignees).catch(() => undefined); }, []);

  const changeStatus = useCallback(async (id: string, status: TicketStatus) => {
    try {
      await api.put(`/api/tickets/${id}/status`, { status });
      await reload();
    } catch (e) {
      showToast({ type: 'error', message: errMessage(e) });
    }
  }, [reload]);

  const assign = useCallback(async (id: string, assignedTo: string) => {
    try {
      await ops.assignTicket(id, assignedTo);
      await reload();
    } catch (e) {
      showToast({ type: 'error', message: errMessage(e) });
    }
  }, [reload]);

  return (
    <OpsListScaffold title="Tickets" loading={loading} error={error} empty={items.length === 0} onRefresh={reload}>
      {items.map((t) => (
        <Card key={t.id} style={styles.card} accentColor={PRIORITY_COLOR[t.priority] ?? '#9CA3AF'}>
          <View style={styles.row}>
            <Text style={[styles.num, { color: c.textPrimary }]}>{t.ticketNumber}</Text>
            <View style={[styles.pill, { backgroundColor: `${STATUS[t.status].color}1A` }]}>
              <Text style={{ color: STATUS[t.status].color, fontSize: fontSize.xs, fontWeight: fontWeight.semibold }}>{STATUS[t.status].label}</Text>
            </View>
          </View>
          <Text style={[styles.title, { color: c.textPrimary }]} numberOfLines={2}>{t.title}</Text>
          <Text style={[styles.meta, { color: c.textSecondary }]}>
            {t.vehicle?.vehicleNumber ?? '—'} · <Text style={{ color: PRIORITY_COLOR[t.priority], fontWeight: fontWeight.semibold }}>{t.priority.toUpperCase()}</Text>
          </Text>
          <Select value={t.status} onChange={(v) => changeStatus(t.id, v as TicketStatus)} options={STATUS_OPTS} label="Set status" />
          <Select value={t.assignedToUser?.id ?? null} onChange={(v) => assign(t.id, v)} options={assignees} label="Assign to" placeholder="Unassigned" searchable />
        </Card>
      ))}
    </OpsListScaffold>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  num: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  title: { fontSize: fontSize.sm, marginVertical: 2 },
  meta: { fontSize: fontSize.sm },
});
