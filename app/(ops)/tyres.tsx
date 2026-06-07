import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontSize, fontWeight, radius, spacing, useColors } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { OpsListScaffold } from '@/components/ops/OpsListScaffold';
import { OpsModal } from '@/components/ops/OpsModal';
import { useOpsList } from '@/hooks/useOpsList';
import { showToast } from '@/store/toast.store';
import { errMessage } from '@/api/client';
import * as ops from '@/api/ops.api';
import type { SelectOption, Tyre, TyreMovementType, TyreStatus } from '@/types/ops.types';

const STATUS: Record<TyreStatus, { label: string; color: string }> = {
  in_stock: { label: 'In Stock', color: '#0EA5C5' },
  in_use: { label: 'In Use', color: '#16A34A' },
  retreading: { label: 'Retreading', color: '#D97706' },
  scrapped: { label: 'Scrapped', color: '#9CA3AF' },
};
const MOVES: SelectOption[] = [
  { value: 'fitted', label: 'Fit to vehicle' }, { value: 'removed', label: 'Remove' },
  { value: 'scrapped', label: 'Scrap' }, { value: 'sent_for_retread', label: 'Send for retread' },
  { value: 'returned_from_retread', label: 'Return from retread' }, { value: 'returned_to_stock', label: 'Return to stock' },
];
const health = (p: number) => (p >= 50 ? '#16A34A' : p >= 20 ? '#D97706' : '#DC2626');

export default function OpsTyres() {
  const c = useColors();
  const { items, loading, error, reload } = useOpsList(ops.getTyres);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);
  const [form, setForm] = useState({ serial: '', brand: '', size: '', life: '80000' });
  const [mv, setMv] = useState<{ tyre: Tyre | null; type: TyreMovementType; vehicleId: string; position: string; odo: string }>({ tyre: null, type: 'fitted', vehicleId: '', position: '', odo: '' });
  const [mvBusy, setMvBusy] = useState(false);

  useEffect(() => { ops.getVehicleOptions().then(setVehicles).catch(() => undefined); }, []);

  const submit = useCallback(async () => {
    if (!form.serial.trim() || !form.brand.trim() || !form.size.trim()) return showToast({ type: 'error', message: 'Serial, brand, size required' });
    setSubmitting(true);
    try {
      await ops.createTyre({ serialNumber: form.serial.trim(), brand: form.brand.trim(), size: form.size.trim(), expectedLifeKm: form.life ? Number(form.life) : 80000 });
      showToast({ type: 'success', message: 'Tyre registered' });
      setOpen(false); setForm({ serial: '', brand: '', size: '', life: '80000' }); await reload();
    } catch (e) { showToast({ type: 'error', message: errMessage(e) }); }
    finally { setSubmitting(false); }
  }, [form, reload]);

  const submitMv = useCallback(async () => {
    if (!mv.tyre) return;
    setMvBusy(true);
    try {
      await ops.addTyreMovement(mv.tyre.id, { movementType: mv.type, vehicleId: mv.vehicleId || null, position: mv.position || null, odometerAtEvent: mv.odo ? Number(mv.odo) : 0 });
      showToast({ type: 'success', message: 'Movement recorded' });
      setMv({ tyre: null, type: 'fitted', vehicleId: '', position: '', odo: '' }); await reload();
    } catch (e) { showToast({ type: 'error', message: errMessage(e) }); }
    finally { setMvBusy(false); }
  }, [mv, reload]);

  return (
    <OpsListScaffold title="Tyre Hub" loading={loading} error={error} empty={items.length === 0} onRefresh={reload} onAdd={() => setOpen(true)}>
      {items.map((t) => (
        <Card key={t.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={[styles.serial, { color: c.textPrimary }]}>{t.serialNumber}</Text>
            <View style={[styles.pill, { backgroundColor: `${STATUS[t.currentStatus].color}1A` }]}>
              <Text style={{ color: STATUS[t.currentStatus].color, fontSize: fontSize.xs, fontWeight: fontWeight.semibold }}>{STATUS[t.currentStatus].label}</Text>
            </View>
          </View>
          <Text style={[styles.meta, { color: c.textSecondary }]}>{t.brand} · {t.size} · {t.currentVehicle?.vehicleNumber ?? (t.currentPosition ?? 'unfitted')}</Text>
          <View style={[styles.bar, { backgroundColor: c.bgSunken }]}>
            <View style={{ width: `${Math.max(0, Math.min(100, t.healthPct))}%`, height: '100%', backgroundColor: health(t.healthPct) }} />
          </View>
          <Text style={[styles.km, { color: c.textTertiary }]}>{t.healthPct}% · {t.totalKmRun.toLocaleString('en-IN')}/{t.expectedLifeKm.toLocaleString('en-IN')} km</Text>
          <Button variant="secondary" size="sm" onPress={() => setMv({ tyre: t, type: 'fitted', vehicleId: '', position: '', odo: String(t.totalKmRun || '') })}>IN / OUT</Button>
        </Card>
      ))}

      <OpsModal open={open} onClose={() => setOpen(false)} title="Register Tyre" onSubmit={submit} submitting={submitting}>
        <Input label="Serial Number" value={form.serial} onChangeText={(v) => setForm((f) => ({ ...f, serial: v }))} />
        <Input label="Brand" value={form.brand} onChangeText={(v) => setForm((f) => ({ ...f, brand: v }))} placeholder="MRF / CEAT / JK" />
        <Input label="Size" value={form.size} onChangeText={(v) => setForm((f) => ({ ...f, size: v }))} placeholder="10.00 R20" />
        <Input label="Expected Life (km)" value={form.life} onChangeText={(v) => setForm((f) => ({ ...f, life: v }))} keyboardType="numeric" />
      </OpsModal>

      <OpsModal open={!!mv.tyre} onClose={() => setMv({ tyre: null, type: 'fitted', vehicleId: '', position: '', odo: '' })} title={mv.tyre ? `Movement — ${mv.tyre.serialNumber}` : 'Movement'} onSubmit={submitMv} submitting={mvBusy} submitLabel="Record">
        <Select value={mv.type} onChange={(v) => setMv((m) => ({ ...m, type: v as TyreMovementType }))} options={MOVES} label="Movement" />
        <Select value={mv.vehicleId || null} onChange={(v) => setMv((m) => ({ ...m, vehicleId: v }))} options={vehicles} label="Vehicle (optional)" placeholder="None" searchable />
        <Input label="Position" value={mv.position} onChangeText={(v) => setMv((m) => ({ ...m, position: v }))} placeholder="FL / RL1" />
        <Input label="Odometer (km)" value={mv.odo} onChangeText={(v) => setMv((m) => ({ ...m, odo: v }))} keyboardType="numeric" />
      </OpsModal>
    </OpsListScaffold>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  serial: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  meta: { fontSize: fontSize.sm },
  bar: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: spacing.xs },
  km: { fontSize: fontSize.xs, marginBottom: spacing.xs },
});
