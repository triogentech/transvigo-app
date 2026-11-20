import { ZoomableImage } from '@/components/ui/ZoomableImage';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
import { VendorFormModal } from '@/components/ops/VendorFormModal';
import type { InvoicePaymentStatus, PaymentMode, SelectOption, SupplierInvoice } from '@/types/ops.types';

const num = (v: string | number) => Number(v);
const STATUS: Record<InvoicePaymentStatus, { label: string; color: string }> = {
  on_credit: { label: 'On Credit', color: '#D97706' },
  fully_paid: { label: 'Fully Paid', color: '#16A34A' },
};
const STATUS_OPTS: SelectOption[] = (Object.keys(STATUS) as InvoicePaymentStatus[]).map((s) => ({ value: s, label: STATUS[s].label }));

const MODE_OPTS: SelectOption[] = [{ value: 'cash', label: 'Cash' }, { value: 'credit', label: 'Credit' }];
const EMPTY = { invoiceNumber: '', vehicleId: '', jobCardId: '', vendorId: '', totalAmount: '', paidAmount: '', paymentMode: 'credit' as PaymentMode };

/** Record how much of the bill has been paid so far (part payments allowed). */
function PaidEditor({ invoice, onSaved }: { invoice: SupplierInvoice; onSaved: () => Promise<void> }) {
  const c = useColors();
  const [value, setValue] = useState(String(invoice.billPaidAmount ?? 0));
  const [saving, setSaving] = useState(false);
  const save = async (): Promise<void> => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return showToast({ type: 'error', message: 'Enter the amount paid' });
    setSaving(true);
    try {
      await ops.updateInvoice(invoice.id, { paidAmount: n });
      await onSaved();
    } catch (e) {
      showToast({ type: 'error', message: errMessage(e) });
    } finally {
      setSaving(false);
    }
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }}>
      <View style={{ flex: 1 }}>
        <Input label="Paid so far (₹)" value={value} onChangeText={setValue} keyboardType="numeric" />
      </View>
      <Pressable onPress={() => void save()} disabled={saving} style={[{ paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: c.border }]}>
        <Text style={{ color: '#2563EB', fontWeight: fontWeight.semibold }}>{saving ? '…' : 'Save'}</Text>
      </Pressable>
    </View>
  );
}

export default function OpsInvoices() {
  const c = useColors();
  const { items, loading, error, reload } = useOpsList(ops.getInvoices);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);
  const [jobCards, setJobCards] = useState<SelectOption[]>([]);
  const [vendors, setVendors] = useState<SelectOption[]>([]);
  const [vendorForm, setVendorForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    ops.getVehicleOptions().then(setVehicles).catch(() => undefined);
    ops.getJobCardOptions().then(setJobCards).catch(() => undefined);
    ops.getSupplierOptions().then(setVendors).catch(() => undefined);
  }, []);

  const takePhoto = async (): Promise<void> => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return showToast({ type: 'error', message: 'Camera permission denied' });
    const result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };
  const pickPhoto = async (): Promise<void> => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };
  const addPhoto = (): void => {
    Alert.alert('Invoice Photo', 'Attach a photo of the invoice', [
      { text: 'Take Photo', onPress: () => void takePhoto() },
      { text: 'Choose from Library', onPress: () => void pickPhoto() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const submit = useCallback(async () => {
    if (!form.invoiceNumber.trim()) return showToast({ type: 'error', message: 'Enter the supplied invoice number' });
    const total = form.totalAmount ? Number(form.totalAmount) : 0;
    const paid = form.paidAmount ? Number(form.paidAmount) : 0;
    if (paid > total) return showToast({ type: 'error', message: 'The paid amount cannot be more than the bill amount' });
    setSubmitting(true);
    try {
      const inv = await ops.createInvoice({
        invoiceNumber: form.invoiceNumber.trim(),
        vehicleId: form.vehicleId || null,
        jobCardId: form.jobCardId || null,
        vendorId: form.vendorId || null,
        totalAmount: total,
        paymentMode: form.paymentMode,
        paidAmount: paid,
        paymentStatus: total > 0 && paid >= total ? 'fully_paid' : 'on_credit',
      });
      // Best-effort photo upload — never block the registered invoice on it.
      if (photoUri) {
        try { await ops.uploadInvoicePhoto(inv.id, photoUri); }
        catch { showToast({ type: 'warning', message: 'Invoice saved, but the photo failed to upload' }); }
      }
      showToast({ type: 'success', message: `Registered ${inv.refNumber}` });
      setOpen(false); setForm(EMPTY); setPhotoUri(null); await reload();
    } catch (e) { showToast({ type: 'error', message: errMessage(e) }); }
    finally { setSubmitting(false); }
  }, [form, photoUri, reload]);

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
            <View style={[styles.pill, { backgroundColor: `${i.settlement === 'paid' ? '#16A34A' : '#D97706'}1A` }]}>
              <Text style={{ color: i.settlement === 'paid' ? '#16A34A' : '#D97706', fontSize: fontSize.xs, fontWeight: fontWeight.semibold }}>{i.settlement === 'paid' ? 'Paid' : 'Pending'}</Text>
            </View>
          </View>
          {i.supplier ? (
            <Text style={[styles.meta, { color: c.textPrimary, fontWeight: fontWeight.semibold }]}>{i.supplier.name} · {i.supplier.vendorCode}</Text>
          ) : null}
          <Text style={[styles.meta, { color: c.textSecondary }]}>
            {i.invoiceNumber} · {i.vehicle?.vehicleNumber ?? '—'}{i.jobCard ? ` · ${i.jobCard.jobCardNumber}` : ''} · {i.paymentMode === 'cash' ? 'Cash' : 'Credit'}
          </Text>
          <Text style={[styles.meta, { color: c.textSecondary }]}>
            Bill ₹{num(i.billRaisedAmount ?? i.totalAmount).toLocaleString('en-IN')} · Paid ₹{num(i.billPaidAmount ?? 0).toLocaleString('en-IN')}
          </Text>
          {i.photoUrl ? <ZoomableImage uri={i.photoUrl} style={styles.thumb} /> : null}
          <PaidEditor key={`${i.id}-${i.billPaidAmount}`} invoice={i} onSaved={reload} />
          <Select value={i.paymentStatus} onChange={(v) => setStatus(i.id, v as InvoicePaymentStatus)} options={STATUS_OPTS} label="Set status (Paid marks the full bill paid)" />
        </Card>
      ))}

      <OpsModal open={open} onClose={() => setOpen(false)} title="Register Invoice" onSubmit={submit} submitting={submitting}>
        <Input label="Supplied Invoice #" value={form.invoiceNumber} onChangeText={(v) => setForm((f) => ({ ...f, invoiceNumber: v }))} placeholder="e.g. VMO-102" />
        <Select value={form.vendorId || null} onChange={(v) => setForm((f) => ({ ...f, vendorId: v }))} options={vendors} label="Billing vendor (spare parts vendor or garage)" placeholder="Select" searchable />
        <Pressable onPress={() => setVendorForm(true)} hitSlop={8}>
          <Text style={{ color: '#2563EB', fontSize: fontSize.sm, fontWeight: fontWeight.semibold }}>+ New vendor</Text>
        </Pressable>
        <Select value={form.vehicleId || null} onChange={(v) => setForm((f) => ({ ...f, vehicleId: v }))} options={vehicles} label="Vehicle (optional)" placeholder="None" searchable />
        <Select value={form.jobCardId || null} onChange={(v) => setForm((f) => ({ ...f, jobCardId: v }))} options={jobCards} label="Job Card (optional)" placeholder="None" searchable />
        <Input label="Total Amount (₹)" value={form.totalAmount} onChangeText={(v) => setForm((f) => ({ ...f, totalAmount: v }))} keyboardType="numeric" />
        <Select value={form.paymentMode} onChange={(v) => setForm((f) => ({ ...f, paymentMode: v as PaymentMode }))} options={MODE_OPTS} label="Bought on" />
        <Input label="Paid so far (₹)" value={form.paidAmount} onChangeText={(v) => setForm((f) => ({ ...f, paidAmount: v }))} keyboardType="numeric" placeholder="0" />

        {photoUri ? (
          <View style={styles.photoWrap}>
            <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
            <Pressable onPress={() => setPhotoUri(null)} hitSlop={8} style={styles.photoRemove}>
              <Ionicons name="close-circle" size={26} color="#fff" />
            </Pressable>
            <Pressable onPress={addPhoto} style={[styles.photoChange, { backgroundColor: c.bgSurface, borderColor: c.border }]}>
              <Text style={{ color: c.textSecondary, fontSize: fontSize.xs, fontWeight: fontWeight.semibold }}>Change</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={addPhoto} style={[styles.photoBtn, { borderColor: c.border, backgroundColor: c.bgSunken }]}>
            <Ionicons name="camera-outline" size={20} color={c.textSecondary} />
            <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>Attach invoice photo</Text>
          </Pressable>
        )}
      </OpsModal>
      <VendorFormModal
        open={vendorForm}
        allowedTypes={['spare_parts', 'garage']}
        onClose={() => setVendorForm(false)}
        onSaved={(v) => {
          ops.getSupplierOptions().then(setVendors).catch(() => undefined);
          setForm((f) => ({ ...f, vendorId: v.id }));
        }}
      />
    </OpsListScaffold>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ref: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  meta: { fontSize: fontSize.sm, marginBottom: spacing.xs },
  thumb: { width: '100%', height: 140, borderRadius: radius.md, marginBottom: spacing.xs },
  photoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.md, paddingVertical: spacing.md },
  photoWrap: { position: 'relative' },
  photo: { width: '100%', height: 180, borderRadius: radius.md },
  photoRemove: { position: 'absolute', top: 6, right: 6 },
  photoChange: { position: 'absolute', bottom: 6, right: 6, borderWidth: 1, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
});
