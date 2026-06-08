import { api } from './client';
import type { NotificationItem } from '@/types/notification.types';

export async function getNotifications(): Promise<NotificationItem[]> {
  const res = await api.get<{ data: NotificationItem[] }>('/api/notifications');
  return res.data.data;
}
