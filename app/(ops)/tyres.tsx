import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
import type { SelectOption, TyreMovementDirection, TyreStatus } from '@/types/ops.types';

const STATUS: Record<TyreStatus, { label: string; color: string }> = {
  in_stock: { label: 'In Stock', color: '#0EA5C5' },
  in_use: { label: 'In Use', color: '#16A34A' },
  retreading: { label: 'Retreading', color: '#D97706' },
  scrapped: { label: 'Scrapped', color: '#9CA3AF' },
};

// Friendly position labels → tyre_position enum values.
const POSITIONS: SelectOption[] = [
  { value: 'FL', label: 'Front Left' },
  { value: 'FR', label: 'Front Right' },
  { value: 'RL1', label: 'Rear Left Inner' },
  { value: 'RL2', label: 'Rear Left Outer' },
  { value: 'RR1', label: 'Rear Right Inner' },
  { value: 'RR2', label: 'Rear Right Outer' },
  { value: 'spare', label: 'Spare Tyre' },
];
const NEXT_IN: SelectOption[] = [{ value: 'in_use', label: 'Active Service' }];
const NEXT_OUT: SelectOption[] = [
  { value: 'in_stock', label: 'Active Service' },
  { value: 'retreading', label: 'Retread Facility' },
  { value: 'scrapped', label: 'Scrap Yard' },
];
const REASONS: SelectOption[] = [
  { value: 'Puncture', label: 'Puncture' },
  { value: 'Normal Wear', label: 'Normal Wear' },
  { value: 'Sidewall Damage', label: 'Sidewall Damage' },
  { value: 'Sent for Retread', label: 'Sent for Retread' },
];
const health = (p: number) => (p >= 50 ? '#16A34A' : p >= 20 ? '#D97706' : '#DC2626');

const EMPTY = {
  vehicleId: '', serial: '', position: 'FL', odo: '',
  brand: '', removalReason: 'Puncture', nextStatus: 'in_use' as TyreStatus,
};

export default function OpsTyres() {
  const c = useColors();
  const { items, loading, error, reload } = useOpsList(ops.getTyres);
  const [open, setOpen] = useState(false);
  const [dir, setDir] = useState<TyreMovementDirection>('in');
  const [busy, setBusy] = useState(false);
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => { ops.getVehicleOptions().then(setVehicles).catch(() => undefined); }, []);

  const openLog = () => { setDir('in'); setForm({ ...EMPTY, nextStatus: 'in_use' }); setOpen(true); };
  const switchDir = (d: TyreMovementDirection) => {
    setDir(d);
    setForm((f) => ({ ...f, nextStatus: d === 'in' ? 'in_use' : 'in_stock' }));
  };

  const submit = useCallback(async () => {
    if (!form.vehicleId) return showToast({ type: 'error', message: 'Select a vehicle' });
    if (!form.serial.trim()) return showToast({ type: 'error', message: 'Enter the tyre serial number' });
    setBusy(true);
    try {
      await ops.tyreMovementLog({
        direction: dir,
        vehicleId: form.vehicleId,
        serialNumber: form.serial.trim(),
        position: form.position,
        odometerKm: form.odo ? Number(form.odo) : 0,
        ...(dir === 'in'
          ? { brand: form.brand.trim() || null, nextStatus: 'in_use' }
          : { removalReason: form.removalReason, nextStatus: form.nextStatus }),
      });
      showToast({ type: 'success', message: dir === 'in' ? 'Tyre fitted' : 'Tyre removed' });
      setOpen(false); setForm(EMPTY); await reload();
    } catch (e) { showToast({ type: 'error', message: errMessage(e) }); }
    finally { setBusy(false); }
  }, [dir, form, reload]);

  const tabColor = dir === 'in' ? '#16A34A' : '#DC2626';

  return (
    <OpsListScaffold title="Tyre Management" loading={loading} error={error} empty={items.length === 0} onRefresh={reload} onAdd={openLog}>
      {items.map((t) => (
        <Card key={t.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={[styles.serial, { color: c.textPrimary }]}>{t.serialNumber}</Text>
            <View style={[styles.pill, { backgroundColor: `${STATUS[t.currentStatus].color}1A` }]}>
              <Text style={{ color: STATUS[t.currentStatus].color, fontSize: fontSize.xs, fontWeight: fontWeight.semibold }}>{STATUS[t.currentStatus].label}</Text>
            </View>
          </View>
          <Text style={[styles.meta, { color: c.textSecondary }]}>{t.brand} · {t.currentVehicle?.vehicleNumber ?? (t.currentPosition ?? 'unfitted')}</Text>
          <View style={[styles.bar, { backgroundColor: c.bgSunken }]}>
            <View style={{ width: `${Math.max(0, Math.min(100, t.healthPct))}%`, height: '100%', backgroundColor: health(t.healthPct) }} />
          </View>
          <Text style={[styles.km, { color: c.textTertiary }]}>{t.healthPct}% · {t.totalKmRun.toLocaleString('en-IN')}/{t.expectedLifeKm.toLocaleString('en-IN')} km</Text>
        </Card>
      ))}

      <OpsModal
        open={open}
        onClose={() => setOpen(false)}
        title="Tyre Movement Log"
        onSubmit={submit}
        submitting={busy}
        submitLabel={dir === 'in' ? 'Log Tyre In Movement' : 'Log Tyre Out Movement'}
      >
        {/* IN / OUT tabs */}
        <View style={[styles.tabs, { borderColor: c.border }]}>
          {(['in', 'out'] as const).map((d) => {
            const on = dir === d;
            const col = d === 'in' ? '#16A34A' : '#DC2626';
            return (
              <Pressable key={d} onPress={() => switchDir(d)} style={[styles.tab, on && { backgroundColor: `${col}22` }]}>
                <Text style={{ color: on ? col : c.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.bold }}>
                  {d === 'in' ? 'TYRE IN (NEW/RETREAD)' : 'TYRE OUT (REMOVAL)'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Select value={form.vehicleId || null} onChange={(v) => setForm((f) => ({ ...f, vehicleId: v }))} options={vehicles} label="Vehicle No *" placeholder="Select vehicle" searchable />
        <Input label="Tyre Serial No *" value={form.serial} onChangeText={(v) => setForm((f) => ({ ...f, serial: v }))} placeholder="e.g. MRF-8921XX" />
        <Select value={form.position} onChange={(v) => setForm((f) => ({ ...f, position: v }))} options={POSITIONS} label="Position *" />
        <Input label="Odometer KM *" value={form.odo} onChangeText={(v) => setForm((f) => ({ ...f, odo: v }))} keyboardType="numeric" placeholder="KM reading" />

        {dir === 'in' ? (
          <>
            <Input label="Brand / Make" value={form.brand} onChangeText={(v) => setForm((f) => ({ ...f, brand: v }))} placeholder="e.g. MRF, CEAT" />
            <Select value={form.nextStatus} onChange={(v) => setForm((f) => ({ ...f, nextStatus: v as TyreStatus }))} options={NEXT_IN} label="Next Status" />
          </>
        ) : (
          <>
            <Select value={form.removalReason} onChange={(v) => setForm((f) => ({ ...f, removalReason: v }))} options={REASONS} label="Removal Reason" />
            <Select value={form.nextStatus} onChange={(v) => setForm((f) => ({ ...f, nextStatus: v as TyreStatus }))} options={NEXT_OUT} label="Next Status" />
          </>
        )}
        <View style={{ height: 2, backgroundColor: tabColor, opacity: 0.25, borderRadius: 1 }} />
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
  tabs: { flexDirection: 'row', borderWidth: 1, borderRadius: radius.md, overflow: 'hidden', marginBottom: spacing.xs },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
});
