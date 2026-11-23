import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, fontWeight, radius, spacing, useColors } from '@/theme';
import { formatDateTime } from '@/utils/format';

interface Props { label?: string; value: Date; onChange: (date: Date) => void; maximumDate?: Date; minimumDate?: Date }

// Web preview variant: the native picker has no web build, so the value is shown read-only.
export function DateTimeField({ label, value }: Props) {
  const c = useColors();
  return (
    <View>
      {label ? <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text> : null}
      <View style={[styles.field, { backgroundColor: c.bgSurface, borderColor: c.border }]}>
        <Ionicons name="time-outline" size={18} color={c.textTertiary} />
        <Text style={[styles.text, { color: c.textPrimary }]}>{formatDateTime(value)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: spacing.xs },
  field: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, minHeight: 52 },
  text: { fontSize: fontSize.md },
});
