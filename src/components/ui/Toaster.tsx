import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, fontWeight, radius, spacing, status as st } from '@/theme';
import { useToastStore, type ToastType } from '@/store/toast.store';

const CFG: Record<ToastType, { bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  success: { bg: st.success, icon: 'checkmark-circle' },
  error: { bg: st.danger, icon: 'alert-circle' },
  info: { bg: st.info, icon: 'information-circle' },
  warning: { bg: st.warning, icon: 'warning' },
};

/** Renders the global toast queue as a stack of pills near the top. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const insets = useSafeAreaInsets();
  if (toasts.length === 0) return null;

  return (
    <View pointerEvents="none" style={[styles.wrap, { top: insets.top + spacing.sm }]}>
      {toasts.map((t) => {
        const cfg = CFG[t.type];
        return (
          <View key={t.id} style={[styles.toast, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={18} color="#FFFFFF" />
            <Text style={styles.text} numberOfLines={2}>
              {t.message}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, zIndex: 100, gap: spacing.sm },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  text: { flex: 1, color: '#FFFFFF', fontSize: fontSize.sm, fontWeight: fontWeight.medium },
});
