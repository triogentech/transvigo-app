import { Platform } from 'react-native';
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

/** Attaches the odometer photo to a report that was just sent. */
export async function uploadReportOdometerPhoto(id: string, uri: string): Promise<string> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    form.append('file', await (await fetch(uri)).blob(), 'odometer.jpg');
  } else {
    form.append('file', { uri, name: 'odometer.jpg', type: 'image/jpeg' } as unknown as Blob);
  }
  const res = await api.post<{ photoUrl: string }>(`/api/driver/maintenance-reports/${id}/odometer-photo`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.photoUrl;
}
