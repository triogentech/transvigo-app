/**
 * TRANSVIGO brand palette, tuned for outdoor / low-light / gloved mobile use.
 * `lightColors` is the default theme; `darkColors` overrides backgrounds and
 * text. Components read a `ThemeColors` object (see ThemeProvider).
 */

export const brand = {
  navy: '#1B2D6B',
  teal: '#0EA5C5',
  green: '#4A9B3C',
} as const;

export const status = {
  success: '#16A34A',
  successBg: '#F0FDF4',
  warning: '#D97706',
  warningBg: '#FFFBEB',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  info: '#2563EB',
  infoBg: '#EFF6FF',
} as const;

export const lightColors = {
  ...brand,
  ...status,

  bgPage: '#F9FAFB',
  bgSurface: '#FFFFFF',
  bgSunken: '#F3F4F6',
  bgCard: '#FFFFFF',

  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
} as const;

export type ThemeColors = Record<keyof typeof lightColors, string>;

export const darkColors: ThemeColors = {
  ...lightColors,

  bgPage: '#0F172A',
  bgSurface: '#1E293B',
  bgSunken: '#0F172A',
  bgCard: '#1E293B',

  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textInverse: '#FFFFFF',

  border: '#334155',
  borderStrong: '#475569',
};

/** Default export used where a theme context is not available (e.g. early boot). */
export const colors = lightColors;
