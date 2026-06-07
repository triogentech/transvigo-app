import { brand, status as st } from '@/theme';
import { Badge } from './Badge';
import type { TicketPriority, TicketStatus, TripStatus } from '@/types/api.types';

type Variant = 'trip' | 'ticket' | 'priority';

interface StatusBadgeProps {
  status: string;
  variant: Variant;
}

interface Spec {
  label: string;
  color: string;
  bg: string;
  dot?: boolean;
  pulse?: boolean;
}

const TEAL_BG = 'rgba(14,165,197,0.12)';
const GRAY = { color: '#6B7280', bg: '#F3F4F6' };
const ORANGE = { color: '#EA580C', bg: '#FFF7ED' };

const TRIP: Record<TripStatus, Spec> = {
  created: { label: 'CREATED', color: st.info, bg: st.infoBg },
  in_transit: { label: 'IN TRANSIT', color: brand.teal, bg: TEAL_BG, dot: true, pulse: true },
  completed: { label: 'COMPLETED', color: st.success, bg: st.successBg },
};

const TICKET: Record<TicketStatus, Spec> = {
  open: { label: 'OPEN', color: st.info, bg: st.infoBg },
  acknowledged: { label: 'ACKNOWLEDGED', color: st.info, bg: st.infoBg },
  in_progress: { label: 'IN PROGRESS', color: brand.teal, bg: TEAL_BG, dot: true, pulse: true },
  resolved: { label: 'RESOLVED', color: st.success, bg: st.successBg },
  closed: { label: 'CLOSED', color: GRAY.color, bg: GRAY.bg },
};

const PRIORITY: Record<TicketPriority, Spec> = {
  critical: { label: 'CRITICAL', color: st.danger, bg: st.dangerBg, dot: true, pulse: true },
  high: { label: 'HIGH', color: ORANGE.color, bg: ORANGE.bg },
  medium: { label: 'MEDIUM', color: st.warning, bg: st.warningBg },
  low: { label: 'LOW', color: GRAY.color, bg: GRAY.bg },
};

function resolveSpec(value: string, variant: Variant): Spec {
  if (variant === 'trip') return TRIP[value as TripStatus] ?? { label: value.toUpperCase(), ...GRAY };
  if (variant === 'priority') return PRIORITY[value as TicketPriority] ?? { label: value.toUpperCase(), ...GRAY };
  return TICKET[value as TicketStatus] ?? { label: value.toUpperCase(), ...GRAY };
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const spec = resolveSpec(status, variant);
  return (
    <Badge
      label={spec.label}
      color={spec.color}
      bg={spec.bg}
      border={spec.bg}
      dot={spec.dot}
      pulse={spec.pulse}
    />
  );
}
