import { api } from './client';
import type { CreateFuelLogBody, FuelLog, Paginated } from '@/types/api.types';

export async function createFuelLog(body: CreateFuelLogBody): Promise<FuelLog> {
  const res = await api.post<FuelLog>('/api/fuel-logs', body);
  return res.data;
}

export async function getFuelLogs(params: { page?: number; pageSize?: number } = {}): Promise<Paginated<FuelLog>> {
  const res = await api.get<Paginated<FuelLog>>('/api/fuel-logs', { params });
  return res.data;
}

export interface FuelStationVendor {
  id: string;
  name: string;
  vendorCode: string;
}

/** Adds a fuel station vendor (a code like FS-0007 is generated). */
export async function createFuelStation(body: { name: string; contactNumber?: string | null }): Promise<FuelStationVendor> {
  const res = await api.post<FuelStationVendor>('/api/fuel-stations', body);
  return res.data;
}
