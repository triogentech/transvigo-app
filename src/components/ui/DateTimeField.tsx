import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, fontWeight, radius, spacing, useColors } from '@/theme';
import { formatDateTime } from '@/utils/format';

interface Props {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  /** The latest time that can be picked (default: now). A driver cannot report a time in the future. */
  maximumDate?: Date;
  minimumDate?: Date;
}

/** A date AND time field. Android only has separate date and time dialogs, so they open one after the other. */
export function DateTimeField({ label, value, onChange, maximumDate, minimumDate }: Props) {
  const c = useColors();
  const [showIOS, setShowIOS] = useState(false);
  const max = maximumDate ?? new Date();

  const open = (): void => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value, mode: 'date', maximumDate: max, minimumDate,
        onChange: (_e: DateTimePickerEvent, day?: Date) => {
          if (!day) return;
          DateTimePickerAndroid.open({
            value: day, mode: 'time', is24Hour: true,
            onChange: (_e2: DateTimePickerEvent, time?: Date) => {
              if (!time) return;
              const picked = new Date(day);
              picked.setHours(time.getHours(), time.getMinutes(), 0, 0);
              onChange(picked.getTime() > max.getTime() ? max : picked);
            },
          });
        },
      });
    } else {
      setShowIOS(true);
    }
  };

  return (
    <View>
      {label ? <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text> : null}
      <Pressable onPress={open} style={[styles.field, { backgroundColor: c.bgSurface, borderColor: c.border }]}>
        <Ionicons name="time-outline" size={18} color={c.textTertiary} />
        <Text style={[styles.text, { color: c.textPrimary }]}>{formatDateTime(value)}</Text>
      </Pressable>
      {Platform.OS === 'ios' && showIOS ? (
        <DateTimePicker
          value={value} mode="datetime" display="spinner" maximumDate={max} minimumDate={minimumDate}
          onChange={(_e, d) => { setShowIOS(false); if (d) onChange(d); }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: spacing.xs },
  field: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, minHeight: 52 },
  text: { fontSize: fontSize.md },
});
