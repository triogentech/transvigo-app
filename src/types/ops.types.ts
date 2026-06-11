// Types for the Operations mobile experience (non-driver roles).

export type JobCardStatus = 'open' | 'in_progress' | 'quality_check' | 'closed' | 'cancelled';
export interface JobCard {
  id: string;
  jobCardNumber: string;
  status: JobCardStatus;
  vehicle?: { id: string; vehicleNumber: string } | null;
  driverComplaint: string;
  garage?: { id: string; name: string } | null;
  supervisor?: { id: string; username: string } | null;
  entryOdometer: number;
  totalJobCost: string | number;
  entryTime: string;
}
export interface CreateJobCardBody {
  vehicleId: string;
  driverComplaint: string;
  entryOdometer?: number;
  garageId?: string | null;
}

export interface SparePart {
  id: string;
  partNumber: string;
  partName: string;
  category: string;
  unitOfMeasure: string;
  currentStockQty: string | number;
  reorderLevel: string | number;
  unitCost: string | number;
  totalStockValue: string | number;
  isActive: boolean;
}
export interface CreateSparePartBody {
  partNumber: string;
  partName: string;
  category: string;
  currentStockQty?: number;
  reorderLevel?: number;
  unitCost?: number;
}
export interface StockAdjustmentBody {
  adjustmentType: 'add' | 'remove';
  qty: number;
  reason: string;
}

export type TyreStatus = 'in_stock' | 'in_use' | 'scrapped' | 'retreading';
export type TyreMovementType =
  | 'fitted' | 'removed' | 'scrapped' | 'sent_for_retread'
  | 'returned_from_retread' | 'returned_to_stock';
export interface Tyre {
  id: string;
  serialNumber: string;
  brand: string;
  size: string;
  currentStatus: TyreStatus;
  currentVehicle?: { id: string; vehicleNumber: string } | null;
  currentPosition?: string | null;
  totalKmRun: number;
  expectedLifeKm: number;
  healthPct: number;
}
export interface CreateTyreBody {
  serialNumber: string;
  brand: string;
  size: string;
  expectedLifeKm?: number;
}
export interface CreateTyreMovementBody {
  movementType: TyreMovementType;
  vehicleId?: string | null;
  position?: string | null;
  odometerAtEvent?: number;
}

export type TyreMovementDirection = 'in' | 'out';
export interface TyreMovementLogBody {
  direction: TyreMovementDirection;
  vehicleId: string;
  serialNumber: string;
  position: string;      // tyre_position enum value (FL/FR/RL1…/spare)
  odometerKm: number;
  brand?: string | null;          // tyre-in only
  removalReason?: string | null;  // tyre-out only
  nextStatus: TyreStatus;
}

export type InvoicePaymentStatus = 'on_credit' | 'fully_paid';
export interface SupplierInvoice {
  id: string;
  refNumber: string;
  invoiceNumber: string;
  vendor?: { id: string; vendorName: string } | null;
  vehicle?: { id: string; vehicleNumber: string } | null;
  jobCard?: { id: string; jobCardNumber: string } | null;
  totalAmount: string | number;
  paymentStatus: InvoicePaymentStatus;
  createdAt: string;
}
export interface CreateInvoiceBody {
  invoiceNumber: string;
  vehicleId?: string | null;
  jobCardId?: string | null;
  vendorId?: string | null;
  totalAmount?: number;
  paymentStatus?: InvoicePaymentStatus;
}

// ── Spare-part issue slip (free-text line items) ──
export interface SpareIssueSlipItem {
  id: string;
  partName: string;
  qtyIssued: string | number;
  unitCost: string | number;
  totalCost: string | number;
}
export interface SpareIssueSlip {
  id: string;
  slipNumber: string;
  vehicle?: { id: string; vehicleNumber: string } | null;
  jobCard?: { id: string; jobCardNumber: string } | null;
  vendor?: { id: string; vendorName: string } | null;
  garage?: { id: string; name: string } | null;
  totalSlipValue: string | number;
  notes?: string | null;
  items: SpareIssueSlipItem[];
  issuedAt: string;
}
export interface CreateIssueSlipItemBody {
  partName: string;
  qtyIssued: number;
  unitCost?: number;
}
export interface CreateIssueSlipBody {
  vehicleId: string;
  jobCardId?: string | null;
  vendorId?: string | null;
  garageId?: string | null;
  notes?: string | null;
  items: CreateIssueSlipItemBody[];
}

export interface GarageLog {
  id: string;
  vehicle?: { id: string; vehicleNumber: string } | null;
  garage?: { id: string; name: string } | null;
  description?: string | null;
  totalCost?: string | number | null;
  serviceDate?: string | null;
  createdAt: string;
}

export interface SelectOption {
  value: string;
  label: string;
}
