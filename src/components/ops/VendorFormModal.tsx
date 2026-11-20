import { useEffect, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { fontSize, spacing, useColors } from '@/theme';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { OpsModal } from './OpsModal';
import { showToast } from '@/store/toast.store';
import { errMessage } from '@/api/client';
import * as ops from '@/api/ops.api';
import { VENDOR_TYPES, type Vendor, type VendorType } from '@/types/vendors.types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (vendor: Vendor) => void;
  /** Lock the type (e.g. "new spare parts vendor" from the issue slip). */
  fixedType?: VendorType;
  /** Restrict the type choice (e.g. an invoice can only be billed by a spare parts vendor or a garage). */
  allowedTypes?: VendorType[];
  /** Edit this vendor instead of creating one. */
  vendor?: Vendor | null;
}

/** Create or edit a vendor of any of the three types. A vendor code is generated unless you type your own. */
export function VendorFormModal({ open, onClose, onSaved, fixedType, allowedTypes, vendor }: Props) {
  const c = useColors();
  const editing = !!vendor;
  const [type, setType] = useState<VendorType>(fixedType ?? 'spare_parts');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [person, setPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType(vendor?.type ?? fixedType ?? allowedTypes?.[0] ?? 'spare_parts');
    setName(vendor?.name ?? '');
    setCode(vendor?.vendorCode ?? '');
    setPerson(vendor?.contactPerson ?? '');
    setPhone(vendor?.contactNumber ?? '');
    setNotes(vendor?.notes ?? '');
    setActive(vendor?.isActive ?? true);
  }, [open, vendor, fixedType, allowedTypes]);

  const submit = async (): Promise<void> => {
    if (!name.trim()) return showToast({ type: 'error', message: 'Enter the vendor name' });
    if (!editing && type === 'load_provider' && !phone.trim()) return showToast({ type: 'error', message: 'A load provider vendor needs a contact number' });
    setSaving(true);
    try {
      const saved = editing
        ? await ops.updateVendor(vendor!.id, {
            name: name.trim(),
            vendorCode: code.trim() || undefined,
            contactPerson: person.trim() || null,
            contactNumber: phone.trim() || null,
            notes: notes.trim() || null,
            isActive: active,
          })
        : await ops.createVendor({
            type,
            name: name.trim(),
            vendorCode: code.trim() || undefined,
            contactPerson: person.trim() || null,
            contactNumber: phone.trim() || null,
            notes: notes.trim() || null,
          });
      showToast({ type: 'success', message: editing ? 'Vendor updated' : `Vendor created · ${saved.vendorCode}` });
      onSaved(saved);
      onClose();
    } catch (e) {
      showToast({ type: 'error', message: errMessage(e, 'Could not save the vendor') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <OpsModal open={open} onClose={onClose} title={editing ? 'Edit vendor' : 'New vendor'} onSubmit={submit} submitting={saving} submitLabel={editing ? 'Save' : 'Create'}>
      {!editing && !fixedType ? (
        <Select value={type} onChange={(v) => setType(v as VendorType)} options={VENDOR_TYPES.filter((t) => !allowedTypes || allowedTypes.includes(t.value)).map((t) => ({ value: t.value, label: t.label }))} label="Vendor type" />
      ) : (
        <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>{VENDOR_TYPES.find((t) => t.value === (vendor?.type ?? type))?.label}</Text>
      )}
      <Input label="Name" value={name} onChangeText={setName} placeholder="Vendor / workshop name" />
      <Input label="Vendor code" value={code} onChangeText={setCode} autoCapitalize="characters" placeholder={editing ? '' : `Leave blank to auto-generate (${VENDOR_TYPES.find((t) => t.value === type)?.prefix}-0001…)`} />
      <Input label="Contact person" value={person} onChangeText={setPerson} placeholder="Optional" />
      <Input label={type === 'load_provider' && !editing ? 'Contact number (required)' : 'Contact number'} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional" multiline />
      {editing ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
          <Text style={{ color: c.textPrimary, fontSize: fontSize.md }}>Active</Text>
          <Switch value={active} onValueChange={setActive} />
        </View>
      ) : null}
    </OpsModal>
  );
}
