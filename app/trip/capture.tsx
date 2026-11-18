import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, fontSize, fontWeight, radius, spacing, status as st, useColors } from '@/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import * as tripsApi from '@/api/trips.api';
import { errMessage, isNetworkError } from '@/api/client';
import { showToast } from '@/store/toast.store';
import { useUpdateStore } from '@/store/update.store';
import { useDriverMe } from '@/hooks/useDriverMe';
import { getCurrentCoords, LocationUnavailableError, type LocationIssue } from '@/utils/trip-capture';
import { allocatedMinutes, formatDuration } from '@/utils/trip-time';
import type { Trip } from '@/types/api.types';

const LOCATION_COPY: Record<LocationIssue, string> = {
  denied: 'Location permission is off for TransVigo.',
  disabled: 'Your phone’s location (GPS) is turned off.',
  unavailable: 'We could not get your location.',
};

/**
 * Start / complete a trip: odometer reading + odometer photo + GPS location are all required.
 * Without location the trip cannot be started or completed, and the operations team is alerted.
 */
export default function TripCaptureScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, stage } = useLocalSearchParams<{ id: string; stage: tripsApi.CaptureStage }>();
  const isStart = stage !== 'end';
  const { me } = useDriverMe();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [odometer, setOdometer] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationIssue, setLocationIssue] = useState<LocationIssue | null>(null);

  useEffect(() => {
    if (!id) return;
    tripsApi
      .getTripDetail(id)
      .then((d) => setTrip(d.trip))
      .catch((e) => setLoadError(errMessage(e)));
  }, [id]);

  // Lowest acceptable reading: the vehicle's last reading to start; the start reading to finish.
  const minimum = isStart ? (me?.currentVehicle?.odometerReading ?? 0) : (trip?.startOdometer ?? 0);

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
    if (!trip || busy) return;
    setError(null);
    setLocationIssue(null);
    const km = Number(odometer);
    if (!odometer.trim() || !Number.isInteger(km) || km < 0) return setError('Enter the odometer reading in whole kilometres');
    if (km < minimum) return setError(`The odometer can’t be lower than the last reading (${minimum.toLocaleString('en-IN')} km)`);
    if (!photoUri) return setError('Take a photo of the odometer');

    setBusy(true);
    try {
      let coords;
      try {
        coords = await getCurrentCoords();
      } catch (e) {
        if (e instanceof LocationUnavailableError) {
          setLocationIssue(e.reason);
          // Tell the back office so they can call the driver; best-effort.
          void tripsApi.reportLocationDenied(trip.id, isStart ? 'start' : 'end').catch(() => undefined);
          return;
        }
        throw e;
      }
      await tripsApi.uploadOdometerPhoto(trip.id, isStart ? 'start' : 'end', photoUri);
      await tripsApi.updateTripStatus(trip.id, isStart ? 'in_transit' : 'completed', { odometer: km, ...coords });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({ type: 'success', message: isStart ? 'Trip started' : 'Trip completed' });
      void useUpdateStore.getState().refreshActiveTrip(); // lets a pending mandatory update take over
      // Drivers can't open past trips: after completing, go Home.
      if (isStart) router.back();
      else router.replace('/(tabs)');
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(
        isNetworkError(e)
          ? 'You need an internet connection to ' + (isStart ? 'start' : 'complete') + ' the trip. Please try again when connected.'
          : errMessage(e, 'Could not update the trip'),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <ScreenHeader title={isStart ? 'Start trip' : 'Complete trip'} />
      {loadError ? (
        <View style={styles.content}>
          <ErrorBanner message={loadError} />
        </View>
      ) : !trip ? null : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]} keyboardShouldPersistTaps="handled">
            <View style={[styles.summary, { backgroundColor: c.bgCard, borderColor: c.border }]}>
              <Text style={[styles.route, { color: c.textPrimary }]}>
                {trip.startPoint} → {trip.endPoint}
              </Text>
              <Text style={[styles.sub, { color: c.textSecondary }]}>
                {trip.vehicle?.vehicleNumber ?? 'No vehicle'} · Allocated time {formatDuration(allocatedMinutes(trip))}
              </Text>
            </View>

            <Input
              label="Odometer reading (km)"
              value={odometer}
              onChangeText={(v) => setOdometer(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder={minimum ? `Last reading ${minimum.toLocaleString('en-IN')}` : 'e.g. 125430'}
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

            <View style={styles.locRow}>
              <Ionicons name="location-outline" size={18} color={c.textTertiary} />
              <Text style={[styles.sub, { color: c.textSecondary, flex: 1 }]}>
                Your location is recorded when you {isStart ? 'start' : 'complete'} the trip.
              </Text>
            </View>

            {locationIssue ? (
              <View style={[styles.alert, { borderColor: st.danger, backgroundColor: 'rgba(220,38,38,0.12)' }]}>
                <Text style={[styles.alertTitle, { color: st.danger }]}>
                  Can’t {isStart ? 'start' : 'complete'} without location
                </Text>
                <Text style={{ color: c.textPrimary, fontSize: fontSize.sm }}>
                  {LOCATION_COPY[locationIssue]} Turn on location for TransVigo, then try again. The operations team has been notified.
                </Text>
                <Button variant="secondary" size="sm" onPress={() => void Linking.openSettings()}>
                  Open settings
                </Button>
              </View>
            ) : null}

            {error ? <Text style={{ color: st.danger, fontSize: fontSize.sm }}>{error}</Text> : null}

            <Button size="lg" fullWidth loading={busy} leftIcon={isStart ? 'play' : 'checkmark-circle'} onPress={() => void submit()}>
              {isStart ? 'Start trip' : 'Complete trip'}
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  summary: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: 4 },
  route: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  sub: { fontSize: fontSize.sm },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  photoBtn: { height: 120, borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  photo: { width: '100%', height: 200, borderRadius: radius.lg },
  retake: { position: 'absolute', right: 8, bottom: 8, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  alert: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  alertTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
});
