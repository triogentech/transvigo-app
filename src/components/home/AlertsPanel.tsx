import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, fontWeight, radius, spacing, status as st, useColors } from '@/theme';
import type { AlertSeverity, DriverAlert } from '@/types/api.types';

const STYLES: Record<AlertSeverity, { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  danger: { color: st.danger, bg: st.dangerBg, icon: 'alert-circle' },
  warning: { color: st.warning, bg: st.warningBg, icon: 'warning' },
  info: { color: st.info, bg: st.infoBg, icon: 'information-circle' },
};

interface AlertsPanelProps {
  alerts: DriverAlert[];
  onPressAlert: (alert: DriverAlert) => void;
}

export function AlertsPanel({ alerts, onPressAlert }: AlertsPanelProps) {
  const c = useColors();
  if (alerts.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: st.warning }]}>⚠ Alerts</Text>
      {alerts.map((a, i) => {
        const s = STYLES[a.severity];
        return (
          <Pressable
            key={`${a.type}-${a.linkId ?? i}`}
            onPress={() => onPressAlert(a)}
            style={[styles.row, { backgroundColor: s.bg }]}
          >
            <Ionicons name={s.icon} size={18} color={s.color} />
            <View style={styles.text}>
              <Text style={[styles.title, { color: c.textPrimary }]} numberOfLines={1}>
                {a.title}
              </Text>
              <Text style={[styles.message, { color: c.textSecondary }]} numberOfLines={2}>
                {a.message}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={c.textTertiary} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  heading: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  text: { flex: 1 },
  title: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  message: { fontSize: fontSize.xs, marginTop: 1 },
});
