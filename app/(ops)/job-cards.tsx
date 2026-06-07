import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontSize, fontWeight, radius, spacing, useColors } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { OpsListScaffold } from '@/components/ops/OpsListScaffold';
import { OpsModal } from '@/components/ops/OpsModal';
import { useOpsList } from '@/hooks/useOpsList';
import { showToast } from '@/store/toast.store';
import { errMessage } from '@/api/client';
import * as ops from '@/api/ops.api';
import type { JobCardStatus, SelectOption } from '@/types/ops.types';

const STATUS: Record<JobCardStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: '#0EA5C5' },
  in_progress: { label: 'In Progress', color: '#D97706' },
  quality_check: { label: 'Quality Check', color: '#7C3AED' },
  closed: { label: 'Closed', color: '#16A34A' },
  cancelled: { label: 'Cancelled', color: '#9CA3AF' },
};
const STATUS_OPTS: SelectOption[] = (Object.keys(STATUS) as JobCardStatus[]).map((s) => ({ value: s, label: STATUS[s].label }));

export default function OpsJobCards() {
  const c = useColors();
  const { items, loading, error, reload } = useOpsList(ops.getJobCards);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);
  const [garages, setGarages] = useState<SelectOption[]>([]);
  const [form, setForm] = useState({ vehicleId: '', complaint: '', odo: '', garageId: '' });

  useEffect(() => {
    ops.getVehicleOptions().then(setVehicles).catch(() => undefined);
    ops.getGarageOptions().then(setGarages).catch(() => undefined);
  }, []);

  const submit = useCallback(async () => {
    if (!form.vehicleId) return showToast({ type: 'error', message: 'Select a vehicle' });
    if (!form.complaint.trim()) return showToast({ type: 'error', message: 'Enter the complaint' });
    setSubmitting(true);
    try {
      await ops.createJobCard({ vehicleId: form.vehicleId, driverComplaint: form.complaint.trim(), entryOdometer: form.odo ? Number(form.odo) : 0, garageId: form.garageId || null });
      showToast({ type: 'success', message: 'Job card created' });
      setOpen(false);
      setForm({ vehicleId: '', complaint: '', odo: '', garageId: '' });
      await reload();
    } catch (e) {
      showToast({ type: 'error', message: errMessage(e) });
    } finally {
      setSubmitting(false);
    }
  }, [form, reload]);

  const changeStatus = async (id: string, s: JobCardStatus) => {
    try {
      await ops.setJobCardStatus(id, s);
      await reload();
    } catch (e) {
      showToast({ type: 'error', message: errMessage(e) });
    }
  };

  return (
    <OpsListScaffold title="Job Cards" loading={loading} error={error} empty={items.length === 0} onRefresh={reload} onAdd={() => setOpen(true)}>
      {items.map((jc) => (
        <Card key={jc.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={[styles.num, { color: c.textPrimary }]}>{jc.jobCardNumber}</Text>
            <View style={[styles.pill, { backgroundColor: `${STATUS[jc.status].color}1A` }]}>
              <Text style={{ color: STATUS[jc.status].color, fontSize: fontSize.xs, fontWeight: fontWeight.semibold }}>{STATUS[jc.status].label}</Text>
            </View>
          </View>
          <Text style={[styles.meta, { color: c.textSecondary }]}>{jc.vehicle?.vehicleNumber ?? '—'} · ₹{Number(jc.totalJobCost).toLocaleString('en-IN')}</Text>
          <Text style={[styles.complaint, { color: c.textPrimary }]} numberOfLines={2}>{jc.driverComplaint}</Text>
          <Select value={jc.status} onChange={(v) => changeStatus(jc.id, v as JobCardStatus)} options={STATUS_OPTS} label="Set status" />
        </Card>
      ))}

      <OpsModal open={open} onClose={() => setOpen(false)} title="New Job Card" onSubmit={submit} submitting={submitting} submitLabel="Create">
        <Select value={form.vehicleId || null} onChange={(v) => setForm((f) => ({ ...f, vehicleId: v }))} options={vehicles} label="Vehicle" placeholder="Select vehicle" searchable />
        <Input label="Driver Complaint" value={form.complaint} onChangeText={(v) => setForm((f) => ({ ...f, complaint: v }))} placeholder="What was reported?" multiline />
        <Input label="Entry Odometer (km)" value={form.odo} onChangeText={(v) => setForm((f) => ({ ...f, odo: v }))} keyboardType="numeric" placeholder="0" />
        <Select value={form.garageId || null} onChange={(v) => setForm((f) => ({ ...f, garageId: v }))} options={garages} label="Garage (optional)" placeholder="Unassigned" />
      </OpsModal>
    </OpsListScaffold>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  num: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  meta: { fontSize: fontSize.sm },
  complaint: { fontSize: fontSize.sm, marginVertical: spacing.xs },
});
