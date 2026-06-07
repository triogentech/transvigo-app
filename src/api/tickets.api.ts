import { api } from './client';
import type { CreateTicketBody, Paginated, Ticket, TicketStatus } from '@/types/api.types';

export interface TicketsParams {
  page?: number;
  pageSize?: number;
  status?: TicketStatus;
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

export async function getTicketsPage(params: TicketsParams): Promise<Paginated<Ticket>> {
  const res = await api.get<Paginated<Ticket>>('/api/tickets', { params });
  return res.data;
}

export async function getTicket(id: string): Promise<Ticket> {
  const res = await api.get<Ticket>(`/api/tickets/${id}`);
  return res.data;
}

export async function createTicket(body: CreateTicketBody): Promise<Ticket> {
  const res = await api.post<Ticket>('/api/tickets', body);
  return res.data;
}
