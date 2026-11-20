import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { OpsModal } from '@/components/ops/OpsModal';
import { showToast } from '@/store/toast.store';
import { errMessage } from '@/api/client';
import { createFuelStation, type FuelStationVendor } from '@/api/fuel-logs.api';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (station: FuelStationVendor) => void;
}

/**
 * Adds a fuel station vendor on the spot, when the pump you filled at is not in the list.
 * A vendor code (FS-0001...) is generated. Drivers and staff can both do this.
 */
export function FuelStationQuickAdd({ open, onClose, onSaved }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setName(''); setPhone(''); }
  }, [open]);

  const submit = async (): Promise<void> => {
    if (!name.trim()) return showToast({ type: 'error', message: 'Enter the fuel station name' });
    setSaving(true);
    try {
      const saved = await createFuelStation({ name: name.trim(), contactNumber: phone.trim() || null });
      showToast({ type: 'success', message: `${saved.name} added (${saved.vendorCode})` });
      onSaved(saved);
      onClose();
    } catch (e) {
      showToast({ type: 'error', message: errMessage(e, 'Could not add the fuel station') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <OpsModal open={open} onClose={onClose} title="Add fuel station" onSubmit={() => void submit()} submitting={saving} submitLabel="Add and select">
      <Input label="Fuel station name" value={name} onChangeText={setName} placeholder="e.g. HP Highway Pump, Karnal" />
      <Input label="Contact number (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
    </OpsModal>
  );
}
