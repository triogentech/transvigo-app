/** Typography scale. `mono` (SpaceMono) is reserved for IDs, numbers, amounts. */
export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

export const fontFamily = {
  /** Loaded via expo-font in the root layout. */
  mono: 'SpaceMono',
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.45,
  relaxed: 1.6,
} as const;
