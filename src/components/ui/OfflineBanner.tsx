import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brand, fontSize, fontWeight, spacing, status } from '@/theme';
import { useOffline } from '@/hooks/useOffline';

/** Thin status strip: shows when offline, or while the queue is syncing. */
export function OfflineBanner() {
  const { isOnline, isSyncing, queuedCount } = useOffline();

  if (isOnline && !isSyncing) return null;

  const syncing = isOnline && isSyncing;
  const bg = syncing ? brand.teal : status.warning;
  const label = syncing
    ? `Syncing ${queuedCount} ${queuedCount === 1 ? 'action' : 'actions'}…`
    : 'No internet connection';

  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      <Ionicons name={syncing ? 'sync' : 'cloud-offline'} size={14} color="#FFFFFF" />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: spacing.xs,
  },
  text: { color: '#FFFFFF', fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
});
