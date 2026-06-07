import { api } from './client';
import type {
  DriverHome,
  DriverMe,
  SelectOption,
  ServiceSchedule,
} from '@/types/api.types';

/**
 * Driver-facing composite endpoints. NOTE: /api/driver/* is delivered in
 * backend stage D12 — these will 404 until that ships. /api/service-schedules
 * and /api/select/* already exist.
 */

export async function getDriverMe(): Promise<DriverMe> {
  const res = await api.get<DriverMe>('/api/driver/me');
  return res.data;
}

export async function getDriverHome(): Promise<DriverHome> {
  const res = await api.get<DriverHome>('/api/driver/home');
  return res.data;
}

export async function registerPushToken(
  token: string,
  platform: 'android' | 'ios',
): Promise<void> {
  await api.patch('/api/driver/push-token', { token, platform });
}

export async function getServiceSchedules(
  params: { vehicleId?: string; status?: string } = {},
): Promise<ServiceSchedule[]> {
  const res = await api.get<{ data: ServiceSchedule[] }>('/api/service-schedules', { params });
  return res.data.data;
}

export async function getSelectOptions(
  entity: string,
  params: Record<string, string> = {},
): Promise<SelectOption[]> {
  const res = await api.get<SelectOption[]>(`/api/select/${entity}`, { params });
  return res.data;
}
