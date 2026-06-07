import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontSize, fontWeight, radius, spacing, status as st, useColors } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { OpsListScaffold } from '@/components/ops/OpsListScaffold';
import { OpsModal } from '@/components/ops/OpsModal';
import { useOpsList } from '@/hooks/useOpsList';
import { showToast } from '@/store/toast.store';
import { errMessage } from '@/api/client';
import * as ops from '@/api/ops.api';
import type { InvoiceStatus, SelectOption } from '@/types/ops.types';

const num = (v: string | number) => Number(v);
const STATUS: Record<InvoiceStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#D97706' },
  outstanding: { label: 'Outstanding', color: '#DC2626' },
  paid: { label: 'Paid', color: '#16A34A' },
};
const STATUS_OPTS: SelectOption[] = (Object.keys(STATUS) as InvoiceStatus[]).map((s) => ({ value: s, label: STATUS[s].label }));

export default function OpsInvoices() {
  const c = useColors();
  const { items, loading, error, reload } = useOpsList(ops.getInvoices);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);
  const [form, setForm] = useState({ invoiceNumber: '', vehicleId: '', estimate: '', billed: '' });

  useEffect(() => { ops.getVehicleOptions().then(setVehicles).catch(() => undefined); }, []);

  const variance = (() => {
    const e = Number(form.estimate); const b = Number(form.billed);
    if (!e || e <= 0) return null;
    const pct = ((b - e) / e) * 100;
    return { pct: Math.round(pct * 10) / 10, flagged: pct > 15 };
  })();

  const submit = useCallback(async () => {
    if (!form.invoiceNumber.trim()) return showToast({ type: 'error', message: 'Enter the invoice number' });
    setSubmitting(true);
    try {
      const inv = await ops.createInvoice({ invoiceNumber: form.invoiceNumber.trim(), vehicleId: form.vehicleId || null, estimatedAmount: form.estimate ? Number(form.estimate) : 0, billedAmount: form.billed ? Number(form.billed) : 0 });
      showToast({ type: 'success', message: `Registered ${inv.refNumber}` });
      setOpen(false); setForm({ invoiceNumber: '', vehicleId: '', estimate: '', billed: '' }); await reload();
    } catch (e) { showToast({ type: 'error', message: errMessage(e) }); }
    finally { setSubmitting(false); }
  }, [form, reload]);

  const setStatus = async (id: string, s: InvoiceStatus) => {
    try { await ops.setInvoiceStatus(id, s); await reload(); }
    catch (e) { showToast({ type: 'error', message: errMessage(e) }); }
  };

  return (
    <OpsListScaffold title="Supplier Invoices" loading={loading} error={error} empty={items.length === 0} onRefresh={reload} onAdd={() => setOpen(true)}>
      {items.map((i) => (
        <Card key={i.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={[styles.ref, { color: c.textPrimary }]}>{i.refNumber}</Text>
            <View style={[styles.pill, { backgroundColor: `${STATUS[i.status].color}1A` }]}>
              <Text style={{ color: STATUS[i.status].color, fontSize: fontSize.xs, fontWeight: fontWeight.semibold }}>{STATUS[i.status].label}</Text>
            </View>
          </View>
          <Text style={[styles.meta, { color: c.textSecondary }]}>
            {i.invoiceNumber} · {i.vehicle?.vehicleNumber ?? '—'} · ₹{num(i.billedAmount).toLocaleString('en-IN')}
            {i.isFlagged ? <Text style={{ color: st.danger, fontWeight: fontWeight.semibold }}>  ⚠ {num(i.variancePct)}%</Text> : null}
          </Text>
          <Select value={i.status} onChange={(v) => setStatus(i.id, v as InvoiceStatus)} options={STATUS_OPTS} label="Set status" />
        </Card>
      ))}

      <OpsModal open={open} onClose={() => setOpen(false)} title="Register Invoice" onSubmit={submit} submitting={submitting}>
        <Input label="Vendor Invoice #" value={form.invoiceNumber} onChangeText={(v) => setForm((f) => ({ ...f, invoiceNumber: v }))} placeholder="e.g. VMO-102" />
        <Select value={form.vehicleId || null} onChange={(v) => setForm((f) => ({ ...f, vehicleId: v }))} options={vehicles} label="Vehicle (optional)" placeholder="None" searchable />
        <Input label="Ops Estimate (₹)" value={form.estimate} onChangeText={(v) => setForm((f) => ({ ...f, estimate: v }))} keyboardType="numeric" />
        <Input label="Billed Amount (₹)" value={form.billed} onChangeText={(v) => setForm((f) => ({ ...f, billed: v }))} keyboardType="numeric" />
        {variance ? (
          <Text style={{ fontSize: fontSize.xs, color: variance.flagged ? st.danger : c.textTertiary }}>
            Variance {variance.pct > 0 ? '+' : ''}{variance.pct}%{variance.flagged ? ' — will be flagged (>15%)' : ''}
          </Text>
        ) : null}
      </OpsModal>
    </OpsListScaffold>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ref: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  meta: { fontSize: fontSize.sm, marginBottom: spacing.xs },
});
