import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, fontWeight, radius, spacing, useColors } from '@/theme';
import { formatDateTime } from '@/utils/format';

interface DateFieldProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
}

export function DateField({ label, value, onChange }: DateFieldProps) {
  const c = useColors();
  const [showIOS, setShowIOS] = useState(false);

  const openPicker = (): void => {
    if (Platform.OS === 'android') {
      // Android: imperative API. Rendering the component on Android crashes in
      // the effect lifecycle, and Android only supports 'date'/'time' (not 'datetime').
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        onChange: (_e: DateTimePickerEvent, d?: Date) => {
          if (d) onChange(d);
        },
      });
    } else {
      setShowIOS(true);
    }
  };

  const onIOSChange = (_e: DateTimePickerEvent, d?: Date): void => {
    setShowIOS(false);
    if (d) onChange(d);
  };

  return (
    <View>
      {label ? <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text> : null}
      <Pressable
        onPress={openPicker}
        style={[styles.field, { backgroundColor: c.bgSurface, borderColor: c.border }]}
      >
        <Ionicons name="calendar-outline" size={18} color={c.textTertiary} />
        <Text style={[styles.text, { color: c.textPrimary }]}>{formatDateTime(value)}</Text>
      </Pressable>
      {Platform.OS === 'ios' && showIOS ? (
        <DateTimePicker value={value} mode="datetime" display="spinner" onChange={onIOSChange} />
      ) : null}
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
