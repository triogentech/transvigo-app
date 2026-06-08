import { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
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
  { value: 'driver_advance', icon: 'cash-outline' },
  { value: 'driver_fooding', icon: 'fast-food-outline' },
  { value: 'diesel_request', icon: 'flame-outline' },
  { value: 'lock_issue', icon: 'lock-closed-outline' },
  { value: 'touching_hold', icon: 'hand-left-outline' },
  { value: 'tyre_request', icon: 'ellipse-outline' },
  { value: 'breakdown', icon: 'construct-outline' },
  { value: 'accident', icon: 'warning-outline' },
  { value: 'loading_issue', icon: 'arrow-down-circle-outline' },
  { value: 'unloading_issue', icon: 'arrow-up-circle-outline' },
  { value: 'other', icon: 'ellipsis-horizontal-circle-outline' },
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
  const [otherIssue, setOtherIssue] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takePhoto = async (): Promise<void> => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return showToast({ type: 'error', message: 'Camera permission denied' });
    const result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };
  const pickPhoto = async (): Promise<void> => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };
  const addPhoto = (): void => {
    Alert.alert('Add Photo', 'Attach a photo to this ticket', [
      { text: 'Take Photo', onPress: () => void takePhoto() },
      { text: 'Choose from Library', onPress: () => void pickPhoto() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

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
    const isOther = issueType === 'other';
    if (isOther && !otherIssue.trim()) return setError('Please specify the issue');
    // For "Other", the driver's free-text becomes the ticket title.
    const effectiveTitle = isOther ? otherIssue.trim() : title.trim();
    if (!effectiveTitle) return setError('Enter a short title');
    if (!description.trim()) return setError('Describe the issue');

    const body: CreateTicketBody = {
      issueType,
      priority,
      title: effectiveTitle,
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
      // Best-effort photo upload — never block the raised ticket on it.
      if (photoUri) {
        try {
          await ticketsApi.uploadTicketPhoto(created.id, photoUri);
        } catch {
          showToast({ type: 'warning', message: 'Ticket raised, but the photo failed to upload' });
        }
      }
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

          {issueType === 'other' ? (
            <Input
              label="Specify the issue"
              value={otherIssue}
              onChangeText={setOtherIssue}
              placeholder="What is the issue?"
            />
          ) : (
            <Input label="Title" value={title} onChangeText={setTitle} placeholder="Brief description of the issue" />
          )}
          <TextArea
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the issue in detail…"
          />
          <Input label="Location" value={location} onChangeText={setLocation} placeholder="Where are you?" leftIcon="location-outline" />

          <Text style={[styles.label, { color: c.textPrimary }]}>Photo (optional)</Text>
          {photoUri ? (
            <View style={styles.photoWrap}>
              <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
              <Pressable onPress={() => setPhotoUri(null)} style={styles.photoRemove} hitSlop={8}>
                <Ionicons name="close-circle" size={26} color="#fff" />
              </Pressable>
              <Pressable onPress={addPhoto} style={[styles.photoChange, { backgroundColor: c.bgSurface, borderColor: c.border }]}>
                <Ionicons name="camera-reverse-outline" size={16} color={c.textSecondary} />
                <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>Change</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={addPhoto} style={[styles.photoBtn, { borderColor: c.border, backgroundColor: c.bgSunken }]}>
              <Ionicons name="camera-outline" size={22} color={brand.teal} />
              <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>Add a photo of the issue</Text>
            </Pressable>
          )}

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
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 56,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.md,
  },
  photoWrap: { position: 'relative' },
  photo: { width: '100%', height: 180, borderRadius: radius.md },
  photoRemove: { position: 'absolute', top: 6, right: 6 },
  photoChange: {
    position: 'absolute', bottom: 8, left: 8, flexDirection: 'row', alignItems: 'center',
    gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1,
  },
});
