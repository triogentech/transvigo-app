export type VendorType = 'load_provider' | 'garage' | 'spare_parts';

export const VENDOR_TYPES: Array<{ value: VendorType; label: string; prefix: string }> = [
  { value: 'load_provider', label: 'Load provider vendor', prefix: 'LP' },
  { value: 'garage', label: 'Garage / workshop', prefix: 'WS' },
  { value: 'spare_parts', label: 'Spare parts vendor', prefix: 'SP' },
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
