export type VendorType = 'load_provider' | 'garage' | 'spare_parts' | 'fuel_station' | 'tyre_hub';

export const VENDOR_TYPES: Array<{ value: VendorType; label: string; prefix: string }> = [
  { value: 'load_provider', label: 'Load provider vendor', prefix: 'LP' },
  { value: 'garage', label: 'Garage / workshop', prefix: 'WS' },
  { value: 'spare_parts', label: 'Spare parts vendor', prefix: 'SP' },
  { value: 'fuel_station', label: 'Fuel station vendor', prefix: 'FS' },
  { value: 'tyre_hub', label: 'Tyre hub vendor', prefix: 'TH' },
];

export interface Vendor {
  id: string;
  type: VendorType;
  typeLabel: string;
  vendorCode: string;
  name: string;
  shortName: string | null;
  contactPerson: string | null;
  contactNumber: string | null;
  isActive: boolean;
  outstandingCredit: number | null;
  notes: string | null;
}

export interface CreateVendorBody {
  type: VendorType;
  name: string;
  vendorCode?: string;
  contactPerson?: string | null;
  contactNumber?: string | null;
  notes?: string | null;
}

export interface UpdateVendorBody {
  name?: string;
  vendorCode?: string;
  contactPerson?: string | null;
  contactNumber?: string | null;
  notes?: string | null;
  isActive?: boolean;
}
