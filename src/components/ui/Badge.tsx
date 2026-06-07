import { StyleSheet, Text, View } from 'react-native';
import { fontSize, fontWeight, radius, spacing } from '@/theme';
import { PulsingDot } from './PulsingDot';

interface BadgeProps {
  label: string;
  color: string;
  bg: string;
  border?: string;
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({ label, color, bg, border, dot, pulse }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border ?? bg }]}>
      {dot ? <PulsingDot color={color} pulse={pulse} /> : null}
      <Text style={[styles.text, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.3,
  },
});
