import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, fontWeight, radius, spacing, useColors } from '@/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { ReportMeta } from '@/components/maintenance/ReportMeta';
import * as maintenanceApi from '@/api/maintenance.api';
import { errMessage } from '@/api/client';
import { formatRelativeTime } from '@/utils/format';
import type { MaintenanceReport } from '@/types/maintenance.types';

/** The driver's own maintenance reports, newest first. */
export default function MaintenanceReports() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [reports, setReports] = useState<MaintenanceReport[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setReports(await maintenanceApi.listReports());
      setError(null);
    } catch (e) {
      setError(errMessage(e));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <ScreenHeader title="Maintenance reports" />
      {error ? (
        <View style={styles.pad}>
          <ErrorBanner message={error} onRetry={load} />
        </View>
      ) : reports === null ? (
        <View style={styles.pad}>
          <Skeleton height={96} borderRadius={radius.lg} />
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(r) => r.id}
          contentContainerStyle={[styles.pad, { paddingBottom: insets.bottom + spacing.xl }]}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
          ListEmptyComponent={<EmptyState icon="construct-outline" title="No reports yet" subtitle="Report a problem with your truck from the Home screen." />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/maintenance/${item.id}`)}
              style={[styles.card, { backgroundColor: c.bgCard, borderColor: c.border }]}
            >
              <View style={styles.top}>
                <Text style={[styles.num, { color: c.textPrimary }]}>{item.jobCardNumber}</Text>
                <Text style={{ color: c.textTertiary, fontSize: fontSize.xs }}>{formatRelativeTime(item.entryTime)}</Text>
              </View>
              <Text style={{ color: c.textPrimary, fontSize: fontSize.md }} numberOfLines={2}>
                {item.driverComplaint}
              </Text>
              <ReportMeta priority={item.priority} responseStatus={item.responseStatus} sla={item.sla} />
              {item._count?.messages ? (
                <Text style={{ color: c.textSecondary, fontSize: fontSize.xs }}>
                  {item._count.messages} {item._count.messages === 1 ? 'message' : 'messages'}
                </Text>
              ) : null}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  num: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
});
