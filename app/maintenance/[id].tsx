import { useCallback, useEffect, useState } from 'react';
import { AppState, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, fontWeight, spacing, useColors } from '@/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { ReportMeta } from '@/components/maintenance/ReportMeta';
import { MessageThread } from '@/components/maintenance/MessageThread';
import * as maintenanceApi from '@/api/maintenance.api';
import { errMessage } from '@/api/client';
import { showToast } from '@/store/toast.store';
import { formatDateTime } from '@/utils/format';

const POLL_MS = 20_000;

/** One maintenance report with its conversation with the office. */
export default function MaintenanceReportDetail() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [report, setReport] = useState<maintenanceApi.MaintenanceReportDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setReport(await maintenanceApi.getReport(id));
      setError(null);
    } catch (e) {
      setError(errMessage(e));
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  // New replies normally arrive by push; poll while the screen is open as a fallback.
  useEffect(() => {
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void load();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const send = async (body: string): Promise<void> => {
    if (!id) return;
    try {
      await maintenanceApi.postReportMessage(id, body);
      await load();
    } catch (e) {
      showToast({ type: 'error', message: errMessage(e, 'Could not send the message') });
      throw e;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <ScreenHeader title={report?.jobCardNumber ?? 'Report'} />
      {error && !report ? (
        <View style={styles.content}>
          <ErrorBanner message={error} onRetry={load} />
        </View>
      ) : !report ? (
        <View style={styles.content}>
          <Skeleton height={120} />
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  await load();
                  setRefreshing(false);
                }}
              />
            }
          >
            <Card style={{ gap: spacing.sm }}>
              <ReportMeta priority={report.priority} responseStatus={report.responseStatus} sla={report.sla} />
              <Text style={{ color: c.textPrimary, fontSize: fontSize.md }}>{report.driverComplaint}</Text>
              <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>
                {report.vehicle.vehicleNumber} · {report.entryOdometer.toLocaleString('en-IN')} km · {formatDateTime(report.entryTime)}
              </Text>
              {report.responseStatus === 'resolved' && report.resolvedAt ? (
                <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>Resolved {formatDateTime(report.resolvedAt)}</Text>
              ) : null}
            </Card>

            <Text style={[styles.heading, { color: c.textTertiary }]}>CONVERSATION</Text>
            <MessageThread
              messages={report.messages}
              viewer="driver"
              closedNote={report.responseStatus === 'resolved' ? 'This report is resolved. Raise a new report if the problem comes back.' : undefined}
              onSend={send}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  heading: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 0.8 },
});
