import type { TicketPriority } from '@/types/api.types';

/** Identical SLA windows to the backend (src/utils/sla.ts). */
export const SLA_HOURS: Record<TicketPriority, number> = {
  critical: 4,
  high: 8,
  medium: 24,
  low: 72,
};

const HOUR_MS = 3_600_000;

export type SlaStatus =
  | 'on_track'
  | 'at_risk'
  | 'breached'
  | 'resolved_on_time'
  | 'resolved_late';

export function getSlaDeadline(openedAt: string | Date, priority: TicketPriority): Date {
  const opened = typeof openedAt === 'string' ? new Date(openedAt) : openedAt;
  return new Date(opened.getTime() + SLA_HOURS[priority] * HOUR_MS);
}

/** Hours left until deadline (negative once breached). */
export function getSlaRemainingHours(
  openedAt: string | Date,
  priority: TicketPriority,
  now: Date = new Date(),
): number {
  return (getSlaDeadline(openedAt, priority).getTime() - now.getTime()) / HOUR_MS;
}

/** Fraction of the SLA window elapsed, clamped 0–1 (for progress bars). */
export function getSlaElapsedFraction(
  openedAt: string | Date,
  priority: TicketPriority,
  now: Date = new Date(),
): number {
  const total = SLA_HOURS[priority] * HOUR_MS;
  const opened = typeof openedAt === 'string' ? new Date(openedAt) : openedAt;
  const elapsed = now.getTime() - opened.getTime();
  return Math.max(0, Math.min(1, elapsed / total));
}

export function getSlaStatus(
  openedAt: string | Date,
  priority: TicketPriority,
  resolvedAt?: string | null,
  now: Date = new Date(),
): SlaStatus {
  if (resolvedAt) {
    const resolved = new Date(resolvedAt);
    return resolved <= getSlaDeadline(openedAt, priority) ? 'resolved_on_time' : 'resolved_late';
  }
  const remaining = getSlaRemainingHours(openedAt, priority, now);
  if (remaining < 0) return 'breached';
  if (remaining <= SLA_HOURS[priority] * 0.25) return 'at_risk';
  return 'on_track';
}

/** "18h 24m remaining" / "OVERDUE by 2h 15m" / "1d 4h remaining" */
export function formatSlaCountdown(
  openedAt: string | Date,
  priority: TicketPriority,
  now: Date = new Date(),
): string {
  const remaining = getSlaRemainingHours(openedAt, priority, now);
  const overdue = remaining < 0;
  const totalMinutes = Math.round(Math.abs(remaining) * 60);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  if (days === 0) parts.push(`${minutes}m`);
  const label = parts.join(' ');
  return overdue ? `OVERDUE by ${label}` : `${label} remaining`;
}
