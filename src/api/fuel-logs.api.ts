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
