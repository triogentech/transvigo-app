import { useEffect } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, fontWeight, radius, spacing, useColors } from '@/theme';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { selectMode, useUpdateStore } from '@/store/update.store';
import { APP_VERSION, APP_VERSION_CODE } from '@/utils/app-version';
import { showToast } from '@/store/toast.store';

function Notes({ notes }: { notes: string[] }) {
  const c = useColors();
  if (notes.length === 0) return null;
  return (
    <View style={{ gap: 6, marginTop: spacing.md }}>
      <Text style={[styles.label, { color: c.textTertiary }]}>WHAT&apos;S NEW</Text>
      {notes.map((n, i) => (
        <Text key={i} style={[styles.note, { color: c.textSecondary }]}>• {n}</Text>
      ))}
    </View>
  );
}

function VersionRows({ required }: { required: string | null }) {
  const c = useColors();
  const rows: Array<[string, string]> = [['Installed', `v${APP_VERSION}${APP_VERSION_CODE ? ` (${APP_VERSION_CODE})` : ''}`]];
  if (required) rows.push([required.startsWith('min:') ? 'Required' : 'Available', `v${required.replace('min:', '')}`]);
  return (
    <View style={[styles.rows, { backgroundColor: c.bgSunken }]}>
      {rows.map(([k, v]) => (
        <View key={k} style={styles.row}>
          <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>{k}</Text>
          <Text style={{ color: c.textPrimary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold }}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Renders the update experience:
 *  - mandatory / maintenance + no active trip  -> full-screen, non-dismissable
 *  - mandatory / maintenance + active trip     -> non-blocking banner (see UpdateBanner)
 *  - optional (Play confirms an update)        -> dismissable bottom sheet, snoozed 24h on "Later"
 * Mount once in the root shell, above the navigator.
 */
export function UpdateGate() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const state = useUpdateStore();
  const mode = selectMode(state);
  const { hasActiveTrip, phase, justUpdated, serverBlock } = state;
  const policy = state.policy ?? (serverBlock
    ? ({ minimumSupportedVersion: serverBlock.minimumSupportedVersion, updateMessage: null, releaseNotes: [], maintenanceMessage: null } as NonNullable<typeof state.policy>)
    : null);

  useEffect(() => {
    if (justUpdated) {
      showToast({ type: 'success', message: `Updated to v${APP_VERSION}` });
      useUpdateStore.setState({ justUpdated: false });
    }
  }, [justUpdated]);

  const blocking = (mode === 'mandatory' || mode === 'maintenance') && hasActiveTrip === false;
  const busy = phase === 'starting' || phase === 'downloading';

  if (blocking && policy) {
    const maintenance = mode === 'maintenance';
    return (
      <Modal visible animationType="fade" onRequestClose={() => undefined} statusBarTranslucent>
        <View style={[styles.full, { backgroundColor: c.bgPage, paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}>
          <ScrollView contentContainerStyle={styles.fullBody}>
            <View style={[styles.iconTile, { backgroundColor: c.bgSunken }]}>
              <Ionicons name={maintenance ? 'construct' : 'cloud-download'} size={34} color={c.textPrimary} />
            </View>
            <Text accessibilityRole="header" style={[styles.title, { color: c.textPrimary }]}>
              {maintenance ? 'Under maintenance' : 'Update required'}
            </Text>
            <Text style={[styles.message, { color: c.textSecondary }]}>
              {maintenance
                ? policy.maintenanceMessage ?? 'TransVigo is temporarily unavailable. Please try again shortly.'
                : 'Your current version is no longer supported. Please update TransVigo Driver to continue.'}
            </Text>
            {!maintenance ? (
              <>
                <VersionRows required={policy.minimumSupportedVersion ? `min:${policy.minimumSupportedVersion}` : null} />
                <Text style={[styles.reason, { color: c.textTertiary }]}>
                  {policy.updateMessage ?? 'This release includes changes needed to keep your trips and logs in sync with operations.'}
                </Text>
                <Notes notes={policy.releaseNotes} />
              </>
            ) : null}
            {phase === 'cancelled' || phase === 'failed' ? (
              <Text accessibilityLiveRegion="polite" style={[styles.error, { color: c.danger ?? '#DC2626' }]}>
                {phase === 'cancelled' ? 'Update was cancelled. You need to update to continue.' : 'Could not start the update. Please try again.'}
              </Text>
            ) : null}
          </ScrollView>
          <Button
            size="lg"
            fullWidth
            loading={busy}
            leftIcon={maintenance ? 'refresh' : 'download'}
            onPress={() => (maintenance ? void state.checkPolicy({ force: true }) : void state.startUpdate())}
          >
            {maintenance ? 'Try again' : phase === 'cancelled' || phase === 'failed' ? 'Retry update' : 'Update application'}
          </Button>
        </View>
      </Modal>
    );
  }

  if (mode === 'optional' && hasActiveTrip === false && policy) {
    return (
      <BottomSheet visible onClose={() => state.snooze()} title="Update available" height={420}>
        <View style={{ padding: spacing.lg }}>
          <Text style={[styles.message, { color: c.textSecondary }]}>
            {policy.updateMessage ?? 'A newer version of TransVigo Driver is available.'}
          </Text>
          <VersionRows required={policy.latestVersion} />
          <Notes notes={policy.releaseNotes} />
          <Text style={[styles.reason, { color: c.textTertiary }]}>
            The app will restart when the download finishes.
          </Text>
          <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
            <Button fullWidth loading={busy} onPress={() => void state.startUpdate()}>Update now</Button>
            <Button fullWidth variant="ghost" onPress={() => state.snooze()}>Later</Button>
          </View>
        </View>
      </BottomSheet>
    );
  }
  return null;
}

/** Non-blocking strip shown while a mandatory update/maintenance is pending but a trip is active. */
export function UpdateBanner() {
  const c = useColors();
  const mode = useUpdateStore((s) => selectMode(s));
  const hasActiveTrip = useUpdateStore((s) => s.hasActiveTrip);
  if (!(mode === 'mandatory' || mode === 'maintenance') || hasActiveTrip === false) return null;
  return (
    <View accessibilityRole="alert" style={[styles.banner, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
      <Ionicons name="warning" size={16} color="#B45309" />
      <Text style={{ flex: 1, color: '#78350F', fontSize: fontSize.sm, fontWeight: fontWeight.medium }}>
        {mode === 'mandatory'
          ? 'Update required. Finish your current trip — you can’t start new trips until you update.'
          : 'TransVigo is under maintenance. Finish your current trip; new trips can’t be started right now.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1, paddingHorizontal: spacing.xl },
  fullBody: { flexGrow: 1, justifyContent: 'center', alignItems: 'stretch', paddingVertical: spacing.xl },
  iconTile: { width: 72, height: 72, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: spacing.lg },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, textAlign: 'center', marginBottom: spacing.sm },
  message: { fontSize: fontSize.md, textAlign: 'center', lineHeight: 22 },
  rows: { borderRadius: radius.md, padding: spacing.md, gap: 6, marginTop: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  reason: { fontSize: fontSize.sm, marginTop: spacing.md, textAlign: 'center' },
  label: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, letterSpacing: 0.6 },
  note: { fontSize: fontSize.sm, lineHeight: 20 },
  error: { fontSize: fontSize.sm, marginTop: spacing.md, textAlign: 'center' },
  banner: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: 1 },
});
