import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, fontWeight, radius, spacing, useColors } from '@/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  /** Renders a show/hide eye toggle and starts masked. */
  password?: boolean;
}

export function Input({ label, error, leftIcon, password, style, ...rest }: InputProps) {
  const c = useColors();
  const [hidden, setHidden] = useState(password ?? false);

  return (
    <View>
      {label ? <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          { backgroundColor: c.bgSurface, borderColor: error ? c.danger : c.border },
        ]}
      >
        {leftIcon ? (
          <Ionicons name={leftIcon} size={18} color={c.textTertiary} style={styles.leftIcon} />
        ) : null}
        <TextInput
          style={[styles.input, { color: c.textPrimary }, style]}
          placeholderTextColor={c.textTertiary}
          secureTextEntry={hidden}
          {...rest}
        />
        {password ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10} style={styles.eye}>
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={20} color={c.textTertiary} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: c.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  leftIcon: { marginRight: spacing.sm },
  input: { flex: 1, fontSize: fontSize.md, paddingVertical: spacing.md },
  eye: { paddingLeft: spacing.sm },
  error: { fontSize: fontSize.xs, marginTop: spacing.xs },
});
