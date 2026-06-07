import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { fontSize, fontWeight, radius, spacing, useColors } from '@/theme';

interface TextAreaProps extends TextInputProps {
  label?: string;
  error?: string;
  height?: number;
}

export function TextArea({ label, error, height = 120, style, ...rest }: TextAreaProps) {
  const c = useColors();
  return (
    <View>
      {label ? <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text> : null}
      <TextInput
        multiline
        textAlignVertical="top"
        placeholderTextColor={c.textTertiary}
        style={[
          styles.input,
          { height, color: c.textPrimary, backgroundColor: c.bgSurface, borderColor: error ? c.danger : c.border },
          style,
        ]}
        {...rest}
      />
      {error ? <Text style={[styles.error, { color: c.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
  },
  error: { fontSize: fontSize.xs, marginTop: spacing.xs },
});
