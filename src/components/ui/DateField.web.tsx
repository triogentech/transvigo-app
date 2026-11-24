import { createElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, fontWeight, radius, spacing, useColors } from '@/theme';

interface DateFieldProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
}

const pad = (n: number): string => String(n).padStart(2, '0');
const toLocal = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Web preview variant: a real date input that opens its picker when the field is clicked.
export function DateField({ label, value, onChange }: DateFieldProps) {
  const c = useColors();
  return (
    <View>
      {label ? <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text> : null}
      <View style={[styles.field, { backgroundColor: c.bgSurface, borderColor: c.border }]}>
        <Ionicons name="calendar-outline" size={18} color={c.textTertiary} />
        {createElement('input', {
          type: 'date',
          value: toLocal(value),
          onChange: (e: { target: { value: string } }) => {
            const d = new Date(`${e.target.value}T${pad(value.getHours())}:${pad(value.getMinutes())}`);
            if (!Number.isNaN(d.getTime())) onChange(d);
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
