import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, fontSize, fontWeight, radius, spacing, status as st, useColors } from '@/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import * as maintenanceApi from '@/api/maintenance.api';
import { errMessage, isNetworkError } from '@/api/client';
import { addToQueue } from '@/utils/offline-queue';
import { useOfflineStore } from '@/store/offline.store';
import { showToast } from '@/store/toast.store';
import { useDriverMe } from '@/hooks/useDriverMe';
import { ackWindowLabel, PRIORITY } from '@/utils/maintenance';
import type { CreateMaintenanceReportBody, Priority } from '@/types/maintenance.types';

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical'];

/** Report a problem with the truck. It becomes a job card the office must acknowledge within the priority's window. */
export default function NewMaintenanceReport() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { me } = useDriverMe();
  const vehicle = me?.currentVehicle ?? null;

  const [description, setDescription] = useState('');
  const [odometer, setOdometer] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queueOffline = (body: CreateMaintenanceReportBody): void => {
    addToQueue({ endpoint: '/api/driver/maintenance-reports', method: 'POST', body: body as unknown as Record<string, unknown> });
    useOfflineStore.getState().refreshCount();
    showToast({ type: 'warning', message: 'No signal — report saved and will be sent when you are connected' });
    router.back();
  };

  const takePhoto = async (): Promise<void> => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      showToast({ type: 'error', message: 'Camera permission is needed to photograph the odometer' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const submit = async (): Promise<void> => {
    if (busy) return;
    setError(null);
    const km = Number(odometer);
    if (description.trim().length < 3) return setError('Describe the problem');
    if (!odometer.trim() || !Number.isInteger(km) || km < 0) return setError('Enter the odometer reading in whole kilometres');
    const online = useOfflineStore.getState().isOnline;
    if (online && !photoUri) return setError('Take a photo of the odometer');
    const body: CreateMaintenanceReportBody = { description: description.trim(), odometer: km, priority };

    setBusy(true);
    try {
      if (!useOfflineStore.getState().isOnline) return queueOffline(body);
      const report = await maintenanceApi.createReport(body);
      if (photoUri) {
        try {
          await maintenanceApi.uploadReportOdometerPhoto(report.id, photoUri);
        } catch {
          showToast({ type: 'warning', message: 'Report sent, but the odometer photo did not upload' });
        }
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({ type: 'success', message: `Sent. The office will reply within ${ackWindowLabel(PRIORITY[priority].ackMinutes)}.` });
      router.replace(`/maintenance/${report.id}`);
    } catch (e) {
      if (isNetworkError(e)) return queueOffline(body);
      setError(errMessage(e, 'Could not send the report'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <ScreenHeader title="Report maintenance" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]} keyboardShouldPersistTaps="handled">
          <View style={[styles.vehicle, { backgroundColor: c.bgSunken }]}>
            <Text style={[styles.vehicleLabel, { color: c.textTertiary }]}>VEHICLE</Text>
            <Text style={[styles.vehicleNumber, { color: brand.teal }]}>{vehicle?.vehicleNumber ?? 'Your assigned vehicle'}</Text>
          </View>

          <Input
            label="Describe the problem"
            value={description}
            onChangeText={setDescription}
            placeholder="What is wrong with the truck?"
            multiline
            style={{ minHeight: 90, textAlignVertical: 'top' }}
          />

          <Input
            label="Odometer reading (km)"
            value={odometer}
            onChangeText={(v) => setOdometer(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder={vehicle?.odometerReading ? `Last reading ${vehicle.odometerReading.toLocaleString('en-IN')}` : 'e.g. 125430'}
            leftIcon="speedometer-outline"
          />

          <View style={{ gap: spacing.sm }}>
            <Text style={[styles.label, { color: c.textSecondary }]}>Photo of the odometer</Text>
            {photoUri ? (
              <View>
                <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
                <Pressable onPress={takePhoto} style={[styles.retake, { backgroundColor: c.bgSurface, borderColor: c.border }]}>
                  <Ionicons name="camera-reverse-outline" size={16} color={c.textPrimary} />
                  <Text style={{ color: c.textPrimary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold }}>Retake</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={takePhoto} style={[styles.photoBtn, { borderColor: c.border, backgroundColor: c.bgSunken }]}>
                <Ionicons name="camera-outline" size={28} color={brand.teal} />
                <Text style={{ color: c.textPrimary, fontWeight: fontWeight.semibold }}>Take photo</Text>
              </Pressable>
            )}
          </View>

          <View style={{ gap: spacing.sm }}>
            <Text style={[styles.label, { color: c.textSecondary }]}>How urgent is it?</Text>
            <View style={styles.chips}>
              {PRIORITIES.map((p) => {
                const active = p === priority;
                const meta = PRIORITY[p];
                return (
                  <Pressable
                    key={p}
                    onPress={() => setPriority(p)}
                    style={[styles.chip, { borderColor: active ? meta.color : c.border, backgroundColor: active ? `${meta.color}22` : c.bgSurface }]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={{ color: active ? meta.color : c.textPrimary, fontWeight: fontWeight.semibold }}>{meta.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>
              The office should reply within {ackWindowLabel(PRIORITY[priority].ackMinutes)}.
            </Text>
          </View>

          {error ? <Text style={{ color: st.danger, fontSize: fontSize.sm }}>{error}</Text> : null}

          <Button size="lg" fullWidth loading={busy} leftIcon="send" onPress={() => void submit()}>
            Send report
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  vehicle: { borderRadius: radius.lg, padding: spacing.md, gap: 2 },
  vehicleLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 0.8 },
  vehicleNumber: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  photoBtn: { height: 120, borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  photo: { width: '100%', height: 200, borderRadius: radius.lg },
  retake: { position: 'absolute', right: 8, bottom: 8, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
  chip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1.5 },
});
