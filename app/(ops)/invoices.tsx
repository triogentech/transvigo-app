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
import type { InvoicePaymentStatus, SelectOption } from '@/types/ops.types';

const num = (v: string | number) => Number(v);
const STATUS: Record<InvoicePaymentStatus, { label: string; color: string }> = {
  on_credit: { label: 'On Credit', color: '#D97706' },
  fully_paid: { label: 'Fully Paid', color: '#16A34A' },
};
const STATUS_OPTS: SelectOption[] = (Object.keys(STATUS) as InvoicePaymentStatus[]).map((s) => ({ value: s, label: STATUS[s].label }));

const EMPTY = { invoiceNumber: '', vehicleId: '', jobCardId: '', vendorId: '', totalAmount: '', paymentStatus: 'on_credit' as InvoicePaymentStatus };

export default function OpsInvoices() {
  const c = useColors();
  const { items, loading, error, reload } = useOpsList(ops.getInvoices);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);
  const [jobCards, setJobCards] = useState<SelectOption[]>([]);
  const [vendors, setVendors] = useState<SelectOption[]>([]);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    ops.getVehicleOptions().then(setVehicles).catch(() => undefined);
    ops.getJobCardOptions().then(setJobCards).catch(() => undefined);
    ops.getVendorOptions().then(setVendors).catch(() => undefined);
  }, []);

  const submit = useCallback(async () => {
    if (!form.invoiceNumber.trim()) return showToast({ type: 'error', message: 'Enter the supplied invoice number' });
    setSubmitting(true);
    try {
      const inv = await ops.createInvoice({
        invoiceNumber: form.invoiceNumber.trim(),
        vehicleId: form.vehicleId || null,
        jobCardId: form.jobCardId || null,
        vendorId: form.vendorId || null,
        totalAmount: form.totalAmount ? Number(form.totalAmount) : 0,
        paymentStatus: form.paymentStatus,
      });
      showToast({ type: 'success', message: `Registered ${inv.refNumber}` });
      setOpen(false); setForm(EMPTY); await reload();
    } catch (e) { showToast({ type: 'error', message: errMessage(e) }); }
    finally { setSubmitting(false); }
  }, [form, reload]);

  const setStatus = async (id: string, s: InvoicePaymentStatus) => {
    try { await ops.setInvoiceStatus(id, s); await reload(); }
    catch (e) { showToast({ type: 'error', message: errMessage(e) }); }
  };

  return (
    <OpsListScaffold title="Supplier Invoices" loading={loading} error={error} empty={items.length === 0} onRefresh={reload} onAdd={() => setOpen(true)}>
      {items.map((i) => (
        <Card key={i.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={[styles.ref, { color: c.textPrimary }]}>{i.refNumber}</Text>
            <View style={[styles.pill, { backgroundColor: `${STATUS[i.paymentStatus].color}1A` }]}>
              <Text style={{ color: STATUS[i.paymentStatus].color, fontSize: fontSize.xs, fontWeight: fontWeight.semibold }}>{STATUS[i.paymentStatus].label}</Text>
            </View>
          </View>
          <Text style={[styles.meta, { color: c.textSecondary }]}>
            {i.invoiceNumber} · {i.vehicle?.vehicleNumber ?? '—'}
            {i.jobCard ? ` · ${i.jobCard.jobCardNumber}` : ''} · ₹{num(i.totalAmount).toLocaleString('en-IN')}
          </Text>
          <Select value={i.paymentStatus} onChange={(v) => setStatus(i.id, v as InvoicePaymentStatus)} options={STATUS_OPTS} label="Set status" />
        </Card>
      ))}

      <OpsModal open={open} onClose={() => setOpen(false)} title="Register Invoice" onSubmit={submit} submitting={submitting}>
        <Input label="Supplied Invoice #" value={form.invoiceNumber} onChangeText={(v) => setForm((f) => ({ ...f, invoiceNumber: v }))} placeholder="e.g. VMO-102" />
        <Select value={form.vendorId || null} onChange={(v) => setForm((f) => ({ ...f, vendorId: v }))} options={vendors} label="Vendor (optional)" placeholder="None" searchable />
        <Select value={form.vehicleId || null} onChange={(v) => setForm((f) => ({ ...f, vehicleId: v }))} options={vehicles} label="Vehicle (optional)" placeholder="None" searchable />
        <Select value={form.jobCardId || null} onChange={(v) => setForm((f) => ({ ...f, jobCardId: v }))} options={jobCards} label="Job Card (optional)" placeholder="None" searchable />
        <Input label="Total Amount (₹)" value={form.totalAmount} onChangeText={(v) => setForm((f) => ({ ...f, totalAmount: v }))} keyboardType="numeric" />
        <Select value={form.paymentStatus} onChange={(v) => setForm((f) => ({ ...f, paymentStatus: v as InvoicePaymentStatus }))} options={STATUS_OPTS} label="Payment Status" />
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
