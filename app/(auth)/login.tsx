import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, fontSize, fontWeight, radius, spacing } from '@/theme';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth.store';
import { showToast } from '@/store/toast.store';

// This screen is a fixed light-themed brand surface (it predates auth), so it
// uses a local palette rather than useColors().
const ink = brand.navy;
const palette = {
  pageBg: '#E9EDF4',
  cardTop: '#FFFFFF',
  cardBottom: '#F4F7FC',
  label: '#1E2A4A',
  body: '#6B7280',
  faint: '#9AA3B2',
  cardBorder: '#E5EAF2',
  divider: '#E5EAF2',
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [needsOrg, setNeedsOrg] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const version = Constants.expoConfig?.version ?? '1.0.0';

  const onSubmit = async (): Promise<void> => {
    setError(null);
    if (!identity.trim() || !password) {
      setError('Enter your driver identity and passkey');
      return;
    }
    setSubmitting(true);
    try {
      await login({ email: identity.trim(), password, orgSlug: orgSlug.trim() || undefined });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (useAuthStore.getState().user?.mustChangePwd) {
        router.replace('/(auth)/change-password');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[login] failed:', err);
      const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3007';
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setError(`Can't reach the server at ${apiUrl}. Check that the backend is running and reachable from this device.`);
        } else {
          const s = err.response.status;
          if (s === 409) {
            setNeedsOrg(true);
            setError('This identity exists at more than one organisation — enter your organisation code below.');
          } else if (s === 401) setError('Invalid identity or passkey');
          else if (s === 403) setError('Account is inactive');
          else setError(`Sign in failed — server error ${s}.`);
        }
      } else {
        setError('Unable to sign in — please try again');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const soon = (what: string) => () => showToast({ type: 'info', message: `${what} — coming soon` });

  return (
    <View style={{ flex: 1, backgroundColor: palette.pageBg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.lg },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient colors={[palette.cardTop, palette.cardBottom]} style={styles.card}>
            {/* Brand */}
            <View style={styles.brandRow}>
              <Text style={styles.wordmark}>TRANSVIGO</Text>
              <View style={styles.logoMark}>
                <View style={styles.logoMarkInner}>
                  <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
                </View>
              </View>
            </View>
            <Text style={styles.tagline}>Smooth Flow Driver Management</Text>

            {/* Heading */}
            <Text style={styles.welcome}>Welcome Back</Text>
            <Text style={styles.subtitle}>Login to start your daily route</Text>

            {/* Identity */}
            <Text style={styles.fieldLabel}>Driver Identity</Text>
            <Input
              value={identity}
              onChangeText={setIdentity}
              placeholder="Email or Driver ID"
              autoCapitalize="none"
              autoComplete="username"
              leftIcon="id-card-outline"
            />

            {/* Passkey */}
            <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>Secure Passkey</Text>
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              leftIcon="lock-closed-outline"
              password
            />

            {needsOrg ? (
              <>
                <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>Organisation</Text>
                <Input
                  value={orgSlug}
                  onChangeText={setOrgSlug}
                  placeholder="your-org-slug"
                  autoCapitalize="none"
                  leftIcon="business-outline"
                />
              </>
            ) : null}

            {/* Remember / Forgot */}
            <View style={styles.metaRow}>
              <Pressable style={styles.remember} onPress={() => setRemember((r) => !r)} hitSlop={8}>
                <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                  {remember ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
                </View>
                <Text style={styles.rememberText}>Remember device</Text>
              </Pressable>
              <Pressable onPress={soon('Passkey recovery')} hitSlop={8}>
                <Text style={styles.link}>Forgot?</Text>
              </Pressable>
            </View>

            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Primary action */}
            <Pressable
              onPress={() => {
                if (submitting) return;
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                void onSubmit();
              }}
              disabled={submitting}
              style={({ pressed }) => [styles.ctaWrap, { opacity: submitting ? 0.7 : pressed ? 0.9 : 1 }]}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={[brand.navy, brand.teal]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cta}
              >
                <Text style={styles.ctaText}>{submitting ? 'Initiating…' : 'Initiate Flow'}</Text>
                {!submitting ? <Ionicons name="arrow-forward" size={18} color="#FFFFFF" /> : null}
              </LinearGradient>
            </Pressable>
          </LinearGradient>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>TransVigo Fleet Management v{version}</Text>
            <Text style={styles.footerText}> • </Text>
            <Pressable onPress={soon('Privacy policy')} hitSlop={6}>
              <Text style={[styles.footerText, styles.footerLink]}>Privacy Policy</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: spacing.lg, justifyContent: 'center' },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    shadowColor: '#1B2D6B',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },

  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  wordmark: { fontSize: fontSize.xxl, fontWeight: fontWeight.heavy, color: ink, letterSpacing: 1 },
  logoMark: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: brand.teal,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  logoMarkInner: { transform: [{ rotate: '-45deg' }] },
  tagline: { textAlign: 'center', color: palette.body, fontSize: fontSize.md, marginTop: spacing.sm },

  welcome: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: ink, marginTop: spacing.xxl },
  subtitle: { fontSize: fontSize.md, color: palette.body, marginTop: spacing.xs, marginBottom: spacing.xl },

  fieldLabel: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: palette.label, marginBottom: spacing.sm },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  remember: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: palette.faint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: brand.navy, borderColor: brand.navy },
  rememberText: { color: palette.body, fontSize: fontSize.sm },
  link: { color: brand.teal, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg },
  errorText: { color: '#DC2626', fontSize: fontSize.sm, flex: 1 },

  ctaWrap: { marginTop: spacing.xl, borderRadius: radius.full, overflow: 'hidden' },
  cta: {
    height: 60,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  ctaText: { color: '#FFFFFF', fontSize: fontSize.lg, fontWeight: fontWeight.bold },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xxl },
  dividerLine: { flex: 1, height: 1, backgroundColor: palette.divider },
  dividerText: { color: palette.faint, fontSize: fontSize.sm },

  partnerRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  partnerCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 64,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
  },
  partnerText: { color: palette.label, fontSize: fontSize.md, fontWeight: fontWeight.semibold, textAlign: 'center' },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg },
  footerText: { color: palette.faint, fontSize: fontSize.xs },
  footerLink: { textDecorationLine: 'underline', color: palette.body },
});
