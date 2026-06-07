import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, fontWeight, status as st } from '@/theme';
import { formatSlaCountdown, getSlaStatus } from '@/utils/sla';
import type { TicketPriority } from '@/types/api.types';

interface TicketSlaTimerProps {
  openedAt: string;
  priority: TicketPriority;
  resolvedAt?: string | null;
}

export function TicketSlaTimer({ openedAt, priority, resolvedAt }: TicketSlaTimerProps) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    if (resolvedAt) return;
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, [resolvedAt]);

  const slaStatus = getSlaStatus(openedAt, priority, resolvedAt ?? undefined, now);

  if (slaStatus === 'resolved_on_time') {
    return <Row color={st.success} icon="checkmark-circle" text="Resolved on time" bold />;
  }
  if (slaStatus === 'resolved_late') {
    return <Row color={st.danger} icon="close-circle" text="Resolved late" bold />;
  }

  const color = slaStatus === 'breached' ? st.danger : slaStatus === 'at_risk' ? st.warning : st.success;
  const icon = slaStatus === 'breached' ? 'alert-circle' : 'time-outline';
  return (
    <Row color={color} icon={icon} text={formatSlaCountdown(openedAt, priority, now)} bold={slaStatus !== 'on_track'} />
  );
}

function Row({
  color,
  icon,
  text,
  bold,
}: {
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.text, { color, fontWeight: bold ? fontWeight.bold : fontWeight.medium }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  text: { fontSize: fontSize.xs },
});
