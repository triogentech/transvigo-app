import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontSize, fontWeight, spacing, status as st, useColors } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { OpsListScaffold } from '@/components/ops/OpsListScaffold';
import { OpsModal } from '@/components/ops/OpsModal';
import { useOpsList } from '@/hooks/useOpsList';
import { showToast } from '@/store/toast.store';
import { errMessage } from '@/api/client';
import * as ops from '@/api/ops.api';
import type { SelectOption } from '@/types/ops.types';

const num = (v: string | number) => Number(v);
type Line = { partName: string; qty: string; cost: string };
const EMPTY_LINE: Line = { partName: '', qty: '', cost: '' };
const EMPTY = { vehicleId: '', jobCardId: '', garageId: '', vendorId: '', notes: '' };

export default function OpsSpareParts() {
  const c = useColors();
  const { items, loading, error, reload } = useOpsList(ops.getIssueSlips);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [lines, setLines] = useState<Line[]>([{ ...EMPTY_LINE }]);
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);
  const [jobCards, setJobCards] = useState<SelectOption[]>([]);
  const [garages, setGarages] = useState<SelectOption[]>([]);
  const [vendors, setVendors] = useState<SelectOption[]>([]);

  useEffect(() => {
    ops.getVehicleOptions().then(setVehicles).catch(() => undefined);
    ops.getJobCardOptions().then(setJobCards).catch(() => undefined);
    ops.getGarageOptions().then(setGarages).catch(() => undefined);
    ops.getVendorOptions().then(setVendors).catch(() => undefined);
  }, []);

  const setLine = (i: number, k: keyof Line, v: string) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)));
  const addLine = () => setLines((ls) => [...ls, { ...EMPTY_LINE }]);
  const removeLine = (i: number) => setLines((ls) => (ls.length === 1 ? ls : ls.filter((_, idx) => idx !== i)));

  const total = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.cost) || 0), 0);

  const reset = () => { setForm(EMPTY); setLines([{ ...EMPTY_LINE }]); };

  const submit = useCallback(async () => {
    if (!form.vehicleId) return showToast({ type: 'error', message: 'Select a vehicle' });
    const valid = lines.filter((l) => l.partName.trim() && Number(l.qty) > 0);
    if (valid.length === 0) return showToast({ type: 'error', message: 'Add at least one part (name + qty)' });
    setSubmitting(true);
    try {
      const slip = await ops.createIssueSlip({
        vehicleId: form.vehicleId,
        jobCardId: form.jobCardId || null,
        garageId: form.garageId || null,
        vendorId: form.vendorId || null,
        notes: form.notes.trim() || null,
        items: valid.map((l) => ({ partName: l.partName.trim(), qtyIssued: Number(l.qty), unitCost: l.cost ? Number(l.cost) : 0 })),
      });
      showToast({ type: 'success', message: `Created ${slip.slipNumber}` });
      setOpen(false); reset(); await reload();
    } catch (e) { showToast({ type: 'error', message: errMessage(e) }); }
    finally { setSubmitting(false); }
  }, [form, lines, reload]);

  return (
    <OpsListScaffold title="Spare Parts" loading={loading} error={error} empty={items.length === 0} onRefresh={reload} onAdd={() => { reset(); setOpen(true); }}>
      {items.map((s) => (
        <Card key={s.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={[styles.ref, { color: c.textPrimary }]}>{s.slipNumber}</Text>
            <Text style={{ color: c.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold }}>₹{num(s.totalSlipValue).toLocaleString('en-IN')}</Text>
          </View>
          <Text style={[styles.meta, { color: c.textSecondary }]}>
            {s.vehicle?.vehicleNumber ?? '—'}{s.jobCard ? ` · ${s.jobCard.jobCardNumber}` : ''}{s.garage ? ` · ${s.garage.name}` : ''} · {s.items?.length ?? 0} item(s)
          </Text>
          {(s.items ?? []).slice(0, 4).map((it) => (
            <Text key={it.id} style={[styles.line, { color: c.textTertiary }]}>• {it.partName} × {num(it.qtyIssued)}{num(it.unitCost) > 0 ? ` @ ₹${num(it.unitCost)}` : ''}</Text>
          ))}
        </Card>
      ))}

      <OpsModal open={open} onClose={() => setOpen(false)} title="New Issue Slip" onSubmit={submit} submitting={submitting} submitLabel="Create Slip">
        <Select value={form.vehicleId || null} onChange={(v) => setForm((f) => ({ ...f, vehicleId: v }))} options={vehicles} label="Vehicle" placeholder="Select" searchable />
        <Select value={form.jobCardId || null} onChange={(v) => setForm((f) => ({ ...f, jobCardId: v }))} options={jobCards} label="Job Card (optional)" placeholder="None" searchable />
        <Select value={form.garageId || null} onChange={(v) => setForm((f) => ({ ...f, garageId: v }))} options={garages} label="Garage (optional)" placeholder="None" searchable />
        <Select value={form.vendorId || null} onChange={(v) => setForm((f) => ({ ...f, vendorId: v }))} options={vendors} label="Vendor (optional)" placeholder="None" searchable />

        <View style={styles.partsHead}>
          <Text style={[styles.partsLabel, { color: c.textSecondary }]}>Parts</Text>
          <Pressable onPress={addLine} hitSlop={8}><Text style={{ color: st.info, fontSize: fontSize.sm, fontWeight: fontWeight.semibold }}>+ Add part</Text></Pressable>
        </View>
        {lines.map((l, i) => (
          <View key={i} style={styles.lineRow}>
            <View style={{ flex: 1 }}>
              <Input label={i === 0 ? 'Part name' : ''} value={l.partName} onChangeText={(v) => setLine(i, 'partName', v)} placeholder="e.g. Brake pad" />
            </View>
            <View style={{ width: 64 }}>
              <Input label={i === 0 ? 'Qty' : ''} value={l.qty} onChangeText={(v) => setLine(i, 'qty', v)} keyboardType="numeric" />
            </View>
            <View style={{ width: 80 }}>
              <Input label={i === 0 ? 'Cost ₹' : ''} value={l.cost} onChangeText={(v) => setLine(i, 'cost', v)} keyboardType="numeric" />
            </View>
            <Pressable onPress={() => removeLine(i)} hitSlop={8} style={{ paddingBottom: spacing.sm }}>
              <Text style={{ color: lines.length === 1 ? c.textTertiary : st.danger, fontSize: fontSize.lg }}>✕</Text>
            </Pressable>
          </View>
        ))}
        <Text style={{ color: c.textTertiary, fontSize: fontSize.xs }}>Total: ₹{total.toLocaleString('en-IN')}</Text>
        <Input label="Notes (optional)" value={form.notes} onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))} placeholder="Remarks" />
      </OpsModal>
    </OpsListScaffold>
  );
}

const styles = StyleSheet.create({
  card: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ref: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  meta: { fontSize: fontSize.sm, marginBottom: spacing.xs },
  line: { fontSize: fontSize.xs },
  partsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  partsLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  lineRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
});
