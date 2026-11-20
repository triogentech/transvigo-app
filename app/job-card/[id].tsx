import { useCallback, useEffect, useState } from 'react';
import { AppState, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, fontWeight, spacing, useColors } from '@/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { ZoomableImage } from '@/components/ui/ZoomableImage';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { ConfirmBottomSheet } from '@/components/ui/ConfirmBottomSheet';
import { ReportMeta } from '@/components/maintenance/ReportMeta';
import { MessageThread } from '@/components/maintenance/MessageThread';
import * as ops from '@/api/ops.api';
import { errMessage } from '@/api/client';
import { showToast } from '@/store/toast.store';
import { formatDateTime } from '@/utils/format';
import type { JobCard } from '@/types/ops.types';
import type { ThreadMessage } from '@/types/maintenance.types';

const POLL_MS = 20_000;

/** Ops view of a job card: the driver's report, the conversation, and Resolve. The first message acknowledges it. */
export default function OpsJobCardDetail() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [card, setCard] = useState<JobCard | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [resolving, setResolving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [jc, msgs] = await Promise.all([ops.getJobCard(id), ops.getJobCardMessages(id)]);
      setCard(jc);
      setMessages(msgs);
      setError(null);
    } catch (e) {
      setError(errMessage(e));
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void load();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const send = async (body: string): Promise<void> => {
    if (!id) return;
    try {
      const r = await ops.postJobCardMessage(id, body);
      if (r.acknowledgedNow) showToast({ type: 'success', message: 'Sent. The report is now acknowledged.' });
      await load();
    } catch (e) {
      showToast({ type: 'error', message: errMessage(e, 'Could not send the message') });
      throw e;
    }
  };

  const resolve = async (): Promise<void> => {
    if (!id || resolving) return;
    setResolving(true);
    try {
      await ops.resolveJobCard(id);
      showToast({ type: 'success', message: 'Marked as resolved' });
      await load();
    } catch (e) {
      showToast({ type: 'error', message: errMessage(e, 'Could not resolve') });
    } finally {
      setResolving(false);
    }
  };

  const resolved = card?.responseStatus === 'resolved';
  const fromDriver = card?.source === 'driver_report';

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <ScreenHeader title={card?.jobCardNumber ?? 'Job card'} />
      {error && !card ? (
        <View style={styles.content}>
          <ErrorBanner message={error} onRetry={load} />
        </View>
      ) : !card ? (
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
              <ReportMeta priority={card.priority} responseStatus={card.responseStatus} sla={card.sla} />
              <Text style={[styles.label, { color: c.textTertiary }]}>REPORTED ISSUE</Text>
              <Text style={{ color: c.textPrimary, fontSize: fontSize.md }}>{card.driverComplaint}</Text>
              <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>
                {card.vehicle?.vehicleNumber ?? '—'}
                {card.driver ? ` · ${card.driver.fullName}` : ''} · {Number(card.entryOdometer).toLocaleString('en-IN')} km
              </Text>
              <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>Created {formatDateTime(card.entryTime)}</Text>
              {card.entryOdometerPhotoUrl ? (
                <>
                  <Text style={[styles.label, { color: c.textTertiary }]}>ODOMETER PHOTO</Text>
                  <ZoomableImage uri={card.entryOdometerPhotoUrl} style={{ width: '100%', height: 180, borderRadius: 12 }} />
                </>
              ) : null}
              {card.acknowledgedAt ? (
                <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>Acknowledged {formatDateTime(card.acknowledgedAt)}</Text>
              ) : null}
              {card.resolvedAt ? (
                <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>Resolved {formatDateTime(card.resolvedAt)}</Text>
              ) : null}
            </Card>

            {fromDriver && !resolved ? (
              <Button variant="secondary" leftIcon="checkmark-circle" loading={resolving} onPress={() => setConfirm(true)} fullWidth>
                Mark as resolved
              </Button>
            ) : null}

            {card.driver ? (
              <>
                <Text style={[styles.label, { color: c.textTertiary }]}>CONVERSATION WITH THE DRIVER</Text>
                <MessageThread
                  messages={messages}
                  viewer="ops"
                  closedNote={resolved ? 'Resolved. The conversation is closed.' : undefined}
                  onSend={send}
                />
              </>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <ConfirmBottomSheet
        visible={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          void resolve();
        }}
        title="Mark as resolved?"
        message="The driver is told it is resolved and the conversation closes."
        confirmLabel="Resolve"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  label: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 0.8 },
});
