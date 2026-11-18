import { api } from './client';
import type { CreateMaintenanceReportBody, MaintenanceReport, ThreadMessage } from '@/types/maintenance.types';

export interface MaintenanceReportDetail extends Omit<MaintenanceReport, 'messages'> {
  messages: ThreadMessage[];
}

export const createReport = (body: CreateMaintenanceReportBody) =>
  api.post<MaintenanceReport>('/api/driver/maintenance-reports', body).then((r) => r.data);

export const listReports = () => api.get<MaintenanceReport[]>('/api/driver/maintenance-reports').then((r) => r.data);

export const getReport = (id: string) =>
  api.get<MaintenanceReportDetail>(`/api/driver/maintenance-reports/${id}`).then((r) => r.data);

export const postReportMessage = (id: string, body: string) =>
  api.post<ThreadMessage>(`/api/driver/maintenance-reports/${id}/messages`, { body }).then((r) => r.data);
