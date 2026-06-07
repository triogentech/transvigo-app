import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, fontWeight, spacing, useColors } from '@/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import { errMessage } from '@/api/client';
import { showToast } from '@/store/toast.store';

export default function ChangePasswordScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const changePassword = useAuthStore((s) => s.changePassword);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (): Promise<void> => {
    setError(null);
    if (next.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (next !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await changePassword({ currentPassword: current, newPassword: next });
      showToast({ type: 'success', message: 'Password changed' });
      const u = useAuthStore.getState().user;
      router.replace(u && u.role !== 'Driver' ? '/(ops)' : '/(tabs)');
    } catch (err) {
      setError(errMessage(err, 'Could not change password'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bgSurface }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: c.textPrimary }]}>Change Password</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          Choose a new password to secure your account.
        </Text>

        <View style={styles.form}>
          <Input label="Current password" value={current} onChangeText={setCurrent} password />
          <Input label="New password" value={next} onChangeText={setNext} password />
          <Input label="Confirm new password" value={confirm} onChangeText={setConfirm} password />

          {error ? <Text style={[styles.error, { color: c.danger }]}>{error}</Text> : null}

          <Button size="lg" fullWidth onPress={onSubmit} loading={submitting}>
            Update Password
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold },
  subtitle: { fontSize: fontSize.sm, marginTop: spacing.xs, marginBottom: spacing.xl },
  form: { gap: spacing.lg },
  error: { fontSize: fontSize.sm },
});
