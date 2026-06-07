import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { brand, fontSize, fontWeight, radius, spacing, useColors } from '@/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: ReactNode;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

const HEIGHT: Record<Size, number> = { sm: 44, md: 52, lg: 60 };
const TEXT_SIZE: Record<Size, number> = { sm: fontSize.sm, md: fontSize.md, lg: fontSize.lg };

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  style,
}: ButtonProps) {
  const c = useColors();
  const isDisabled = disabled || loading;

  const bg: Record<Variant, string> = {
    primary: brand.navy,
    secondary: c.bgSurface,
    danger: c.danger,
    ghost: 'transparent',
  };
  const fg: Record<Variant, string> = {
    primary: '#FFFFFF',
    secondary: brand.navy,
    danger: '#FFFFFF',
    ghost: brand.navy,
  };
  const borderColor: Record<Variant, string> = {
    primary: brand.navy,
    secondary: brand.navy,
    danger: c.danger,
    ghost: 'transparent',
  };

  const handlePress = (): void => {
    if (isDisabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          height: HEIGHT[size],
          backgroundColor: bg[variant],
          borderColor: borderColor[variant],
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={fg[variant]} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <Ionicons name={leftIcon} size={18} color={fg[variant]} style={styles.icon} /> : null}
          <Text style={[styles.label, { color: fg[variant], fontSize: TEXT_SIZE[size] }]}>{children}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  content: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: spacing.sm },
  label: { fontWeight: fontWeight.semibold },
});
