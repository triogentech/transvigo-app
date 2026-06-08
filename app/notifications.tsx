import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { brand, fontSize, fontWeight, radius, spacing, status as st, useColors } from '@/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { getNotifications } from '@/api/notifications.api';
import { titleCase } from '@/utils/format';
import type { NotificationItem } from '@/types/notification.types';

const META: Record<NotificationItem['type'], { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  tickets: { icon: 'alert-circle', color: '#EA580C', label: 'Ticket' },
  'job-cards': { icon: 'construct', color: '#2563EB', label: 'Job Card' },
  trips: { icon: 'map', color: brand.navy, label: 'Trip' },
};

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return `${d}d ago`;
}

function message(n: NotificationItem): string {
  const kind = META[n.type].label;
  if (n.action === 'CREATE') return `New ${kind.toLowerCase()} ${n.label}`;
  if (n.changedField === 'assigned') return `${kind} ${n.label} was assigned`;
  if (n.changedField === 'status' && n.status) return `${kind} ${n.label} → ${titleCase(n.status)}`;
  return `${kind} ${n.label} updated`;
}

export default function NotificationsScreen() {
  const c = useColors();
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getNotifications());
    } catch {
      // best-effort
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const open = (n: NotificationItem) => {
    if (n.type === 'tickets') router.push(`/ticket/${n.recordId}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <ScreenHeader title="Notifications" />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={brand.navy} />}
      >
        {!loading && items.length === 0 ? (
          <EmptyState icon="notifications-outline" title="No notifications" subtitle="Updates to tickets, job cards and trips show up here." />
        ) : null}
        {items.map((n) => {
          const m = META[n.type];
          return (
            <Pressable
              key={n.id}
              onPress={() => open(n)}
              style={[styles.row, { backgroundColor: c.bgSurface, borderColor: c.border }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${m.color}1A` }]}>
                <Ionicons name={m.icon} size={18} color={m.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.msg, { color: c.textPrimary }]}>{message(n)}</Text>
                {n.subtitle ? <Text style={[styles.sub, { color: c.textSecondary }]} numberOfLines={1}>{n.subtitle}</Text> : null}
                <Text style={[styles.meta, { color: c.textTertiary }]}>{n.by} · {timeAgo(n.at)}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  iconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  msg: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  sub: { fontSize: fontSize.sm, marginTop: 1 },
  meta: { fontSize: fontSize.xs, marginTop: 4 },
});
