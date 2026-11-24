import { api } from './client';
import type { CreateTicketBody, Paginated, Ticket, TicketStatus } from '@/types/api.types';
import type { ThreadMessage } from '@/types/maintenance.types';

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

/** The conversation with the office on this ticket (oldest first). */
export async function getTicketMessages(id: string): Promise<ThreadMessage[]> {
  const res = await api.get<ThreadMessage[]>(`/api/tickets/${id}/messages`);
  return res.data;
}

/** Reply to the office. A driver's reply never acknowledges the ticket; only the office's first message does. */
export async function postTicketMessage(id: string, body: string): Promise<void> {
  await api.post(`/api/tickets/${id}/messages`, { body });
}

export async function createTicket(body: CreateTicketBody): Promise<Ticket> {
  const res = await api.post<Ticket>('/api/tickets', body);
  return res.data;
}

/** Attach a photo (local file URI) to a ticket via multipart upload. */
export async function uploadTicketPhoto(id: string, uri: string): Promise<Ticket> {
  const form = new FormData();
  form.append('file', { uri, name: 'photo.jpg', type: 'image/jpeg' } as unknown as Blob);
  const res = await api.post<Ticket>(`/api/tickets/${id}/photo`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}
