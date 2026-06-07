import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, fontSize, fontWeight, spacing, status as st, useColors } from '@/theme';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth.store';
import { initialsOf } from '@/utils/format';

export default function OpsProfile() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bgPage }} contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxl }]}>
      <Text style={[styles.title, { color: c.textPrimary }]}>MY PROFILE</Text>
      <Card style={styles.card}>
        <View style={[styles.avatar, { backgroundColor: brand.navy }]}>
          <Text style={styles.avatarText}>{initialsOf(user?.username ?? 'Ops')}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: c.textPrimary }]}>{user?.username ?? 'Operations'}</Text>
          <Text style={[styles.sub, { color: c.textSecondary }]}>{user?.email}</Text>
          <Text style={[styles.role, { color: brand.teal }]}>{user?.role ?? 'Operations'}</Text>
        </View>
      </Card>

      <Card style={{ padding: 0 }}>
        <Row icon="key-outline" label="Change Password" onPress={() => router.push('/(auth)/change-password')} />
        <Row icon="information-circle-outline" label="App Version" right={<Text style={{ color: c.textTertiary, fontSize: fontSize.sm }}>{version}</Text>} />
      </Card>

      <Pressable onPress={confirmSignOut} style={styles.signOut}>
        <Ionicons name="log-out-outline" size={18} color={st.danger} />
        <Text style={[styles.signOutText, { color: st.danger }]}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({ icon, label, onPress, right }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void; right?: React.ReactNode }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.row, { borderBottomColor: c.border }]}>
      <Ionicons name={icon} size={20} color={c.textSecondary} />
      <Text style={[styles.rowLabel, { color: c.textPrimary }]}>{label}</Text>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={c.textTertiary} /> : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.heavy, letterSpacing: 0.5 },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  name: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  sub: { fontSize: fontSize.sm, marginTop: 2 },
  role: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 52, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLabel: { flex: 1, fontSize: fontSize.md },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  signOutText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
});
