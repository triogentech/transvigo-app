import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontSize, fontWeight, radius, spacing, status as st, useColors } from '@/theme';
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
import type { SparePart } from '@/types/ops.types';

const num = (v: string | number) => Number(v);

export default function OpsSpareParts() {
  const c = useColors();
  const { items, loading, error, reload } = useOpsList(ops.getSpareParts);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ partNumber: '', partName: '', category: '', stock: '', reorder: '', cost: '' });
  const [adj, setAdj] = useState<{ part: SparePart | null; type: 'add' | 'remove'; qty: string; reason: string }>({ part: null, type: 'add', qty: '', reason: '' });
  const [adjBusy, setAdjBusy] = useState(false);

  const low = (p: SparePart) => num(p.currentStockQty) <= num(p.reorderLevel);

  const submit = useCallback(async () => {
    if (!form.partNumber.trim() || !form.partName.trim() || !form.category.trim())
      return showToast({ type: 'error', message: 'Part #, name and category required' });
    setSubmitting(true);
    try {
      await ops.createSparePart({
        partNumber: form.partNumber.trim(), partName: form.partName.trim(), category: form.category.trim(),
        currentStockQty: form.stock ? Number(form.stock) : 0, reorderLevel: form.reorder ? Number(form.reorder) : 0, unitCost: form.cost ? Number(form.cost) : 0,
      });
      showToast({ type: 'success', message: 'Part added' });
      setOpen(false);
      setForm({ partNumber: '', partName: '', category: '', stock: '', reorder: '', cost: '' });
      await reload();
    } catch (e) { showToast({ type: 'error', message: errMessage(e) }); }
    finally { setSubmitting(false); }
  }, [form, reload]);

  const submitAdj = useCallback(async () => {
    if (!adj.part) return;
    if (!adj.qty || Number(adj.qty) <= 0) return showToast({ type: 'error', message: 'Enter a quantity' });
    if (!adj.reason.trim()) return showToast({ type: 'error', message: 'Enter a reason' });
    setAdjBusy(true);
    try {
      await ops.adjustStock(adj.part.id, { adjustmentType: adj.type, qty: Number(adj.qty), reason: adj.reason.trim() });
      showToast({ type: 'success', message: 'Stock adjusted' });
      setAdj({ part: null, type: 'add', qty: '', reason: '' });
      await reload();
    } catch (e) { showToast({ type: 'error', message: errMessage(e) }); }
    finally { setAdjBusy(false); }
  }, [adj, reload]);

  return (
    <OpsListScaffold title="Spare Parts" loading={loading} error={error} empty={items.length === 0} onRefresh={reload} onAdd={() => setOpen(true)}>
      {items.map((p) => (
        <Card key={p.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={[styles.name, { color: c.textPrimary }]}>{p.partName}</Text>
            <Text style={{ color: low(p) ? st.danger : c.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold }}>
              {num(p.currentStockQty)} {p.unitOfMeasure}{low(p) ? ' · LOW' : ''}
            </Text>
          </View>
          <Text style={[styles.meta, { color: c.textSecondary }]}>{p.partNumber} · {p.category} · ₹{num(p.unitCost).toLocaleString('en-IN')}/u</Text>
          <Button variant="secondary" size="sm" onPress={() => setAdj({ part: p, type: 'add', qty: '', reason: '' })}>Adjust stock</Button>
        </Card>
      ))}

      <OpsModal open={open} onClose={() => setOpen(false)} title="Add Spare Part" onSubmit={submit} submitting={submitting}>
        <Input label="Part Number" value={form.partNumber} onChangeText={(v) => setForm((f) => ({ ...f, partNumber: v }))} />
        <Input label="Part Name" value={form.partName} onChangeText={(v) => setForm((f) => ({ ...f, partName: v }))} />
        <Input label="Category" value={form.category} onChangeText={(v) => setForm((f) => ({ ...f, category: v }))} placeholder="e.g. Brakes" />
        <Input label="Opening Stock" value={form.stock} onChangeText={(v) => setForm((f) => ({ ...f, stock: v }))} keyboardType="numeric" />
        <Input label="Reorder Level" value={form.reorder} onChangeText={(v) => setForm((f) => ({ ...f, reorder: v }))} keyboardType="numeric" />
        <Input label="Unit Cost (₹)" value={form.cost} onChangeText={(v) => setForm((f) => ({ ...f, cost: v }))} keyboardType="numeric" />
      </OpsModal>

      <OpsModal open={!!adj.part} onClose={() => setAdj({ part: null, type: 'add', qty: '', reason: '' })} title={adj.part ? `Adjust — ${adj.part.partName}` : 'Adjust'} onSubmit={submitAdj} submitting={adjBusy} submitLabel="Apply">
        <Select value={adj.type} onChange={(v) => setAdj((a) => ({ ...a, type: v as 'add' | 'remove' }))} options={[{ value: 'add', label: 'Add (received)' }, { value: 'remove', label: 'Remove (issued)' }]} label="Adjustment" />
        <Input label="Quantity" value={adj.qty} onChangeText={(v) => setAdj((a) => ({ ...a, qty: v }))} keyboardType="numeric" />
        <Input label="Reason" value={adj.reason} onChangeText={(v) => setAdj((a) => ({ ...a, reason: v }))} placeholder="e.g. PO-1023" />
      </OpsModal>
    </OpsListScaffold>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, flex: 1 },
  meta: { fontSize: fontSize.sm, marginBottom: spacing.xs },
});
