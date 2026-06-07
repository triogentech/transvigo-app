import { api } from './client';
import type { CreateTollLogBody, TollLog } from '@/types/api.types';

export async function createTollLog(body: CreateTollLogBody): Promise<TollLog> {
  const res = await api.post<TollLog>('/api/toll-logs', body);
  return res.data;
}
