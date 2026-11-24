import { createElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, fontWeight, radius, spacing, useColors } from '@/theme';

interface Props { label?: string; value: Date; onChange: (date: Date) => void; maximumDate?: Date; minimumDate?: Date }

const pad = (n: number): string => String(n).padStart(2, '0');
/** A Date as the local `YYYY-MM-DDTHH:mm` an <input type="datetime-local"> expects. */
const toLocal = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

// Web preview variant: a real date-time input that opens its picker when the field is clicked.
export function DateTimeField({ label, value, onChange, maximumDate, minimumDate }: Props) {
  const c = useColors();
  const max = maximumDate ?? new Date();
  return (
    <View>
      {label ? <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text> : null}
      <View style={[styles.field, { backgroundColor: c.bgSurface, borderColor: c.border }]}>
        <Ionicons name="time-outline" size={18} color={c.textTertiary} />
        {createElement('input', {
          type: 'datetime-local',
          value: toLocal(value),
          max: toLocal(max),
          min: minimumDate ? toLocal(minimumDate) : undefined,
          onChange: (e: { target: { value: string } }) => {
            const d = new Date(e.target.value);
            if (!Number.isNaN(d.getTime())) onChange(d.getTime() > max.getTime() ? max : d);
          },
          onClick: (e: { currentTarget: { showPicker?: () => void } }) => {
            try { e.currentTarget.showPicker?.(); } catch { /* already open */ }
          },
          style: { flex: 1, border: 'none', outline: 'none', background: 'transparent', color: c.textPrimary, fontSize: fontSize.md, fontFamily: 'inherit', minHeight: 50, cursor: 'pointer' },
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: spacing.xs },
  field: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, minHeight: 52 },
});
