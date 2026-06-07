import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, fontSize, fontWeight, radius, spacing, status as st, useColors } from '@/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Button } from '@/components/ui/Button';
import { useLocation } from '@/hooks/useLocation';
import { useOfflineStore } from '@/store/offline.store';
import { addToQueue } from '@/utils/offline-queue';
import * as ticketsApi from '@/api/tickets.api';
import { errMessage, isNetworkError } from '@/api/client';
import { showToast } from '@/store/toast.store';
import { titleCase } from '@/utils/format';
import type { CreateTicketBody, TicketIssueType, TicketPriority } from '@/types/api.types';

const ISSUE_TYPES: { value: TicketIssueType; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'breakdown', icon: 'construct' },
  { value: 'accident', icon: 'car-sport' },
  { value: 'tyre_puncture', icon: 'ellipse' },
  { value: 'engine_issue', icon: 'cog' },
  { value: 'electrical_issue', icon: 'flash' },
  { value: 'brake_issue', icon: 'hand-left' },
  { value: 'service_due', icon: 'notifications' },
  { value: 'driver_complaint', icon: 'chatbubble-ellipses' },
  { value: 'other', icon: 'help-circle' },
];

const PRIORITIES: { value: TicketPriority; color: string }[] = [
  { value: 'low', color: '#9CA3AF' },
  { value: 'medium', color: st.warning },
  { value: 'high', color: '#EA580C' },
  { value: 'critical', color: st.danger },
];

export default function NewTicketScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { location: geoLocation, loading: geoLoading, requestLocation } = useLocation();

  const [issueType, setIssueType] = useState<TicketIssueType | null>(null);
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (geoLocation && !location) setLocation(geoLocation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoLocation]);

  const submit = async (): Promise<void> => {
    setError(null);
    if (!issueType) return setError('Select an issue type');
    if (!title.trim()) return setError('Enter a short title');
    if (!description.trim()) return setError('Describe the issue');

    const body: CreateTicketBody = {
      issueType,
      priority,
      title: title.trim(),
      description: description.trim(),
      location: location.trim() || null,
    };

    setSubmitting(true);
    if (!useOfflineStore.getState().isOnline) {
      addToQueue({ endpoint: '/api/tickets', method: 'POST', body: body as unknown as Record<string, unknown> });
      useOfflineStore.getState().refreshCount();
      showToast({ type: 'warning', message: 'Saved offline — will sync when connected' });
      setSubmitting(false);
      router.replace('/(tabs)/tickets');
      return;
    }
    try {
      const created = await ticketsApi.createTicket(body);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({ type: 'success', message: `Ticket ${created.ticketNumber} raised` });
      router.replace(`/ticket/${created.id}`);
    } catch (e) {
      if (isNetworkError(e)) {
        addToQueue({ endpoint: '/api/tickets', method: 'POST', body: body as unknown as Record<string, unknown> });
        useOfflineStore.getState().refreshCount();
        showToast({ type: 'warning', message: 'Saved offline — will sync when connected' });
        router.replace('/(tabs)/tickets');
      } else {
        setError(errMessage(e, 'Could not raise ticket'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <ScreenHeader title="Report Issue" icon="close" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.locationRow, { backgroundColor: c.bgSunken }]}>
            <Ionicons name="location" size={16} color={brand.teal} />
            <Text style={[styles.locationText, { color: c.textSecondary }]}>
              {geoLoading ? 'Detecting location…' : location || 'Location unavailable — add manually below'}
            </Text>
          </View>

          <Text style={[styles.label, { color: c.textPrimary }]}>Issue Type</Text>
          <View style={styles.grid}>
            {ISSUE_TYPES.map((it) => {
              const active = issueType === it.value;
              return (
                <Pressable
                  key={it.value}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setIssueType(it.value);
                  }}
                  style={[
                    styles.tile,
                    { backgroundColor: active ? brand.navy : c.bgSurface, borderColor: active ? brand.navy : c.border },
                  ]}
                >
                  <Ionicons name={it.icon} size={22} color={active ? '#FFFFFF' : c.textSecondary} />
                  <Text style={[styles.tileText, { color: active ? '#FFFFFF' : c.textPrimary }]}>{titleCase(it.value)}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: c.textPrimary }]}>Priority</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => {
              const active = priority === p.value;
              return (
                <Pressable
                  key={p.value}
                  onPress={() => setPriority(p.value)}
                  style={[
                    styles.priorityPill,
                    { backgroundColor: active ? p.color : c.bgSurface, borderColor: active ? p.color : c.border },
                  ]}
                >
                  <Text style={[styles.priorityText, { color: active ? '#FFFFFF' : c.textSecondary }]}>
                    {titleCase(p.value)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {priority === 'critical' ? (
            <View style={[styles.warning, { backgroundColor: st.warningBg }]}>
              <Ionicons name="warning" size={16} color={st.warning} />
              <Text style={[styles.warningText, { color: st.warning }]}>
                Critical tickets have a 4-hour SLA response time.
              </Text>
            </View>
          ) : null}

          <Input label="Title" value={title} onChangeText={setTitle} placeholder="Brief description of the issue" />
          <TextArea
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the issue in detail…"
          />
          <Input label="Location" value={location} onChangeText={setLocation} placeholder="Where are you?" leftIcon="location-outline" />

          {error ? <Text style={[styles.error, { color: c.danger }]}>{error}</Text> : null}

          <Button size="lg" fullWidth onPress={submit} loading={submitting} leftIcon="send">
            Submit Report
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md },
  locationText: { flex: 1, fontSize: fontSize.sm },
  label: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, marginTop: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    width: '47.5%',
    flexGrow: 1,
    minHeight: 72,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  tileText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, textAlign: 'center' },
  priorityRow: { flexDirection: 'row', gap: spacing.sm },
  priorityPill: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1 },
  priorityText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  warning: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md },
  warningText: { flex: 1, fontSize: fontSize.sm },
  error: { fontSize: fontSize.sm },
});
