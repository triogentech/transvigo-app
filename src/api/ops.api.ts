import { api } from './client';
import type { Paginated } from '@/types/api.types';
import type {
  CreateInvoiceBody, CreateIssueSlipBody, CreateJobCardBody, CreateSparePartBody, CreateTyreBody,
  CreateTyreMovementBody, GarageLog, InvoicePaymentStatus, JobCard, JobCardStatus,
  InvoiceAnalytics, SelectOption, SparePart, SpareAnalytics, SpareIssueSlip,
  StockAdjustmentBody, SupplierInvoice, Tyre, TyreMovementLogBody,
} from '@/types/ops.types';

const list = async <T>(path: string): Promise<T[]> => {
  const res = await api.get<Paginated<T>>(path, { params: { page: 1, pageSize: 100 } });
  return res.data.data;
};

// ── Job Cards ──
export const getJobCards = () => list<JobCard>('/api/job-cards');
export const createJobCard = (body: CreateJobCardBody) => api.post<JobCard>('/api/job-cards', body).then((r) => r.data);
export const setJobCardStatus = (id: string, status: JobCardStatus) =>
  api.put<JobCard>(`/api/job-cards/${id}/status`, { status }).then((r) => r.data);
export const assignJobCard = (id: string, supervisorId: string) =>
  api.put<JobCard>(`/api/job-cards/${id}`, { supervisorId }).then((r) => r.data);

// ── Tickets (assignment) ──
export const assignTicket = (id: string, assignedTo: string) =>
  api.put(`/api/tickets/${id}/assign`, { assignedTo }).then((r) => r.data);

// ── Assignees (all users except drivers) ──
export const getAssignees = async (): Promise<SelectOption[]> => {
  const res = await api.get<SelectOption[]>('/api/select/assignees');
  return res.data;
};

// ── Spare Parts (catalog) ──
export const getSpareParts = () => list<SparePart>('/api/spare-parts');
export const createSparePart = (body: CreateSparePartBody) => api.post<SparePart>('/api/spare-parts', body).then((r) => r.data);
export const adjustStock = (id: string, body: StockAdjustmentBody) =>
  api.post<SparePart>(`/api/spare-parts/${id}/stock-adjustment`, body).then((r) => r.data);

// ── Spare-part issue slips (free-text line items, SPI numbering) ──
export const getIssueSlips = () => list<SpareIssueSlip>('/api/spare-issue-slips');
export const createIssueSlip = (body: CreateIssueSlipBody) =>
  api.post<SpareIssueSlip>('/api/spare-issue-slips', body).then((r) => r.data);

// ── Analytics ──
export const getInvoiceAnalytics = () => api.get<InvoiceAnalytics>('/api/invoices/analytics').then((r) => r.data);
export const getSpareAnalytics = () => api.get<SpareAnalytics>('/api/spare-issue-slips/analytics').then((r) => r.data);

// ── Tyres ──
export const getTyres = () => list<Tyre>('/api/tyres');
export const createTyre = (body: CreateTyreBody) => api.post<Tyre>('/api/tyres', body).then((r) => r.data);
export const tyreMovementLog = (body: TyreMovementLogBody) =>
  api.post('/api/tyres/movement-log', body).then((r) => r.data);
export const addTyreMovement = (id: string, body: CreateTyreMovementBody) =>
  api.post<Tyre>(`/api/tyres/${id}/movement`, body).then((r) => r.data);

// ── Supplier Invoices ──
export const getInvoices = () => list<SupplierInvoice>('/api/invoices');
export const createInvoice = (body: CreateInvoiceBody) => api.post<SupplierInvoice>('/api/invoices', body).then((r) => r.data);
export const setInvoiceStatus = (id: string, paymentStatus: InvoicePaymentStatus) =>
  api.put<SupplierInvoice>(`/api/invoices/${id}/payment`, { paymentStatus }).then((r) => r.data);
export const uploadInvoicePhoto = async (id: string, uri: string): Promise<SupplierInvoice> => {
  const form = new FormData();
  form.append('file', { uri, name: 'invoice.jpg', type: 'image/jpeg' } as unknown as Blob);
  const res = await api.post<SupplierInvoice>(`/api/invoices/${id}/photo`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
};

// ── Maintenance (garage logs) ──
export const getGarageLogs = () => list<GarageLog>('/api/garage-logs');

// ── Dropdowns ──
export const getVehicleOptions = async (): Promise<SelectOption[]> => {
  const res = await api.get<SelectOption[]>('/api/select/vehicles');
  return res.data;
};
export const getGarageOptions = async (): Promise<SelectOption[]> => {
  const res = await api.get<SelectOption[]>('/api/select/garages');
  return res.data;
};
export const getJobCardOptions = async (): Promise<SelectOption[]> => {
  const res = await api.get<SelectOption[]>('/api/select/job-cards');
  return res.data;
};
export const getVendorOptions = async (): Promise<SelectOption[]> => {
  const res = await api.get<SelectOption[]>('/api/select/spare-vendors');
  return res.data;
};
