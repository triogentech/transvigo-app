import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { radius, spacing, useColors } from '@/theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  accentColor?: string;
}

export function Card({ children, style, onPress, accentColor }: CardProps) {
  const c = useColors();
  const base: ViewStyle = {
    backgroundColor: c.bgCard,
    borderColor: c.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...(accentColor ? { borderLeftColor: accentColor, borderLeftWidth: 4 } : {}),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [base, { opacity: pressed ? 0.9 : 1 }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

export const cardStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
