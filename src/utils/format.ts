import { format, formatDistanceToNowStrict, isToday, isYesterday } from 'date-fns';
import type { Trip } from '@/types/api.types';

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const inrDecimal = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const enIN = new Intl.NumberFormat('en-IN');

/** "₹1,25,000" — Indian grouping, no paise by default. */
export function formatCurrency(amount: number | string, withPaise = false): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(n)) return '₹0';
  return (withPaise ? inrDecimal : inr).format(n);
}

/** "1,42,850 KM" */
export function formatKm(km: number): string {
  return `${enIN.format(Math.round(km))} KM`;
}

export function formatNumber(n: number): string {
  return enIN.format(n);
}

/** "2h ago" | "Yesterday" | "3 days ago" */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  if (isToday(d)) return formatDistanceToNowStrict(d, { addSuffix: true });
  if (isYesterday(d)) return 'Yesterday';
  return formatDistanceToNowStrict(d, { addSuffix: true });
}

/** "30 May, 2:45 PM" */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  return format(d, 'd MMM, h:mm a');
}

/** "30 May 2026" */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  return format(d, 'd MMM yyyy');
}

export function maskAadhaar(aadhaar: string): string {
  const last4 = aadhaar.replace(/\D/g, '').slice(-4);
  return `XXXX-XXXX-${last4}`;
}

export function getTripRoute(trip: Pick<Trip, 'startPoint' | 'endPoint'>): string {
  return `${trip.startPoint} → ${trip.endPoint}`;
}

/** "tyre_puncture" → "Tyre Puncture" */
export function titleCase(snake: string): string {
  return snake
    .split('_')
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : ''))
    .join(' ');
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}
