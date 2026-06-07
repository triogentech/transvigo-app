import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, fontFamily, fontSize, fontWeight, radius, spacing, status as st, useColors } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore, type ThemeMode } from '@/store/theme.store';
import * as driverApi from '@/api/driver.api';
import { formatKm, initialsOf, titleCase } from '@/utils/format';
import type { DriverMe, ServiceSchedule } from '@/types/api.types';

export default function ProfileScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [me, setMe] = useState<DriverMe | null>(null);
  const [schedules, setSchedules] = useState<ServiceSchedule[]>([]);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await driverApi.getDriverMe();
        if (!active) return;
        setMe(data);
        if (data.currentVehicle) {
          const sch = await driverApi.getServiceSchedules({ vehicleId: data.currentVehicle.id });
          if (active) setSchedules(sch);
        }
      } catch {
        // /api/driver/me arrives in backend stage D12 — show basics until then.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const name = me?.driver?.fullName ?? user?.username ?? 'Driver';
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const confirmSignOut = (): void => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bgPage }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxl }]}
    >
      <Text style={[styles.title, { color: c.textPrimary }]}>MY PROFILE</Text>

      <Card style={styles.driverCard}>
        <View style={[styles.avatar, { backgroundColor: brand.navy }]}>
          <Text style={styles.avatarText}>{initialsOf(name)}</Text>
        </View>
        <View style={styles.driverInfo}>
          <Text style={[styles.driverName, { color: c.textPrimary }]}>{name}</Text>
          {me?.driver ? (
            <Text style={[styles.driverSub, { color: c.textSecondary }]}>
              {me.driver.countryDialCode} {me.driver.contactNumber}
            </Text>
          ) : (
            <Text style={[styles.driverSub, { color: c.textSecondary }]}>{user?.email}</Text>
          )}
          {me?.driver ? (
            <View style={{ marginTop: spacing.xs }}>
              <Badge label={titleCase(me.driver.currentStatus)} color={brand.teal} bg="rgba(14,165,197,0.12)" />
            </View>
          ) : null}
        </View>
      </Card>

      {me?.currentVehicle ? (
        <Card style={styles.section}>
          <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>CURRENT VEHICLE</Text>
          <Text style={[styles.vehicleNumber, { color: brand.teal }]}>{me.currentVehicle.vehicleNumber}</Text>
          <Text style={[styles.vehicleMeta, { color: c.textSecondary }]}>
            {[me.currentVehicle.model, me.currentVehicle.axleType].filter(Boolean).join(' · ')}
          </Text>
          {typeof me.currentVehicle.odometerReading === 'number' ? (
            <Text style={[styles.odometer, { color: c.textPrimary }]}>{formatKm(me.currentVehicle.odometerReading)}</Text>
          ) : null}

          {schedules.length > 0 ? (
            <View style={styles.schedules}>
              <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>UPCOMING SERVICES</Text>
              {schedules.map((s) => {
                const overdue = s.status === 'overdue';
                const km = s.kmRemaining ?? 0;
                const color = overdue || km <= 0 ? st.danger : km < 5000 ? st.warning : st.success;
                return (
                  <View key={s.id} style={[styles.scheduleRow, { borderBottomColor: c.border }]}>
                    <Text style={[styles.scheduleType, { color: c.textPrimary }]}>{titleCase(s.serviceType)}</Text>
                    <Text style={[styles.scheduleKm, { color }]}>
                      {overdue ? 'Overdue' : `in ${formatKm(Math.max(0, km))}`}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}
        </Card>
      ) : null}

      <SettingsGroup title="ACCOUNT">
        <SettingsRow icon="key-outline" label="Change Password" onPress={() => router.push('/(auth)/change-password')} />
      </SettingsGroup>

      <SettingsGroup title="APP">
        <SettingsRow
          icon="notifications-outline"
          label="Notifications"
          right={<Switch value={notifications} onValueChange={setNotifications} />}
        />
        <ThemeModeRow />
        <SettingsRow icon="information-circle-outline" label="App Version" right={<Text style={[styles.rowValue, { color: c.textTertiary }]}>{version}</Text>} />
      </SettingsGroup>

      <SettingsGroup title="SUPPORT">
        <SettingsRow icon="call-outline" label="Contact Support" onPress={() => void Linking.openURL('mailto:support@transvigo.com')} />
        <SettingsRow icon="document-text-outline" label="About TransVigo" onPress={() => Alert.alert('TransVigo Driver', `Version ${version}`)} />
      </SettingsGroup>

      <Pressable onPress={confirmSignOut} style={styles.signOut}>
        <Ionicons name="log-out-outline" size={18} color={st.danger} />
        <Text style={[styles.signOutText, { color: st.danger }]}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, { color: c.textTertiary }]}>{title}</Text>
      <Card style={{ padding: 0 }}>{children}</Card>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  onPress,
  right,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.row, { borderBottomColor: c.border }]}>
      <Ionicons name={icon} size={20} color={c.textSecondary} />
      <Text style={[styles.rowLabel, { color: c.textPrimary }]}>{label}</Text>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={c.textTertiary} /> : null)}
    </Pressable>
  );
}

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
];

/** Appearance selector: System / Light / Dark, persisted via the theme store. */
function ThemeModeRow() {
  const c = useColors();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  return (
    <View style={[styles.themeBlock, { borderBottomColor: c.border }]}>
      <View style={styles.themeHeader}>
        <Ionicons name="contrast-outline" size={20} color={c.textSecondary} />
        <Text style={[styles.rowLabel, { color: c.textPrimary }]}>Appearance</Text>
      </View>
      <View style={[styles.segment, { backgroundColor: c.bgSunken }]}>
        {THEME_OPTIONS.map((o) => {
          const active = mode === o.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => setMode(o.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.segmentItem, active && { backgroundColor: c.bgSurface }]}
            >
              <Ionicons name={o.icon} size={16} color={active ? brand.navy : c.textTertiary} />
              <Text style={[styles.segmentText, { color: active ? c.textPrimary : c.textTertiary }]}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.heavy, letterSpacing: 0.5 },
  driverCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  driverInfo: { flex: 1 },
  driverName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  driverSub: { fontSize: fontSize.sm, marginTop: 2 },
  section: { gap: spacing.xs },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, letterSpacing: 0.4 },
  vehicleNumber: { fontFamily: fontFamily.mono, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  vehicleMeta: { fontSize: fontSize.sm },
  odometer: { fontFamily: fontFamily.mono, fontSize: fontSize.md, fontWeight: fontWeight.semibold, marginTop: spacing.xs },
  schedules: { marginTop: spacing.md, gap: 2 },
  scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  scheduleType: { fontSize: fontSize.sm },
  scheduleKm: { fontSize: fontSize.sm, fontFamily: fontFamily.mono, fontWeight: fontWeight.semibold },
  group: { gap: spacing.xs },
  groupTitle: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, letterSpacing: 0.4, marginLeft: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { flex: 1, fontSize: fontSize.md },
  rowValue: { fontSize: fontSize.sm },
  themeBlock: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  themeHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  segment: { flexDirection: 'row', borderRadius: radius.md, padding: 3, gap: 3 },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  segmentText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  signOutText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
});
