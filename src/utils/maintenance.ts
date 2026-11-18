import { status as st } from '@/theme';
import type { AckSla, Priority, ResponseStatus } from '@/types/maintenance.types';

export const PRIORITY: Record<Priority, { label: string; color: string; ackMinutes: number }> = {
  critical: { label: 'Critical', color: st.danger, ackMinutes: 30 },
  high: { label: 'High', color: '#EA580C', ackMinutes: 60 },
  medium: { label: 'Medium', color: st.warning, ackMinutes: 120 },
  low: { label: 'Low', color: '#6B7280', ackMinutes: 180 },
};

export const RESPONSE: Record<ResponseStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: st.warning },
  acknowledged: { label: 'Acknowledged', color: st.info },
  resolved: { label: 'Resolved', color: st.success },
};

export function ackWindowLabel(minutes: number): string {
  return minutes < 60 ? `${minutes} minutes` : minutes === 60 ? '1 hour' : `${minutes / 60} hours`;
}

const dur = (minutes: number): string => {
  const m = Math.abs(Math.round(minutes));
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
};

/** Live text + colour for the acknowledgement SLA (computed from the deadline so it can tick). */
export function slaText(sla: AckSla | null | undefined, now: Date = new Date()): { text: string; color: string } | null {
  if (!sla) return null;
  if (sla.status === 'met') return { text: 'Replied on time', color: st.success };
  if (sla.status === 'missed') return { text: 'Replied late', color: st.danger };
  const left = (new Date(sla.dueAt).getTime() - now.getTime()) / 60_000;
  if (left < 0) return { text: `Reply overdue by ${dur(left)}`, color: st.danger };
  return { text: `Reply due in ${dur(left)}`, color: left <= 15 ? st.warning : st.info };
}
