import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, fontWeight, radius, spacing, useColors } from '@/theme';
import { formatDateTime } from '@/utils/format';

interface DateFieldProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
}

// Web preview variant: the native date picker (@react-native-community/datetimepicker)
// has no web build, so this shows the (default = now) value read-only.
export function DateField({ label, value }: DateFieldProps) {
  const c = useColors();
  return (
    <View>
      {label ? <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text> : null}
      <View style={[styles.field, { backgroundColor: c.bgSurface, borderColor: c.border }]}>
        <Ionicons name="calendar-outline" size={18} color={c.textTertiary} />
        <Text style={[styles.text, { color: c.textPrimary }]}>{formatDateTime(value)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  text: { fontSize: fontSize.md },
});
