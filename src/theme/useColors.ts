import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type ThemeColors } from './colors';
import { useThemeStore } from '@/store/theme.store';

/**
 * Resolves the effective light/dark scheme from the user's saved preference,
 * falling back to the OS setting when the preference is `system`.
 */
export function useResolvedScheme(): 'light' | 'dark' {
  const mode = useThemeStore((s) => s.mode);
  const system = useColorScheme();
  const effective = mode === 'system' ? (system ?? 'light') : mode;
  return effective === 'dark' ? 'dark' : 'light';
}

/**
 * Returns the active theme colors. Honours the user's Light/Dark/System choice
 * (see the Profile screen), not just the OS setting.
 */
export function useColors(): ThemeColors {
  return useResolvedScheme() === 'dark' ? darkColors : lightColors;
}
