import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, radius, spacing, status as st, useColors } from '@/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DateTimeField } from '@/components/ui/DateTimeField';
import { PhotoField } from '@/components/trip/PhotoField';
import * as tripsApi from '@/api/trips.api';
import { errMessage, isNetworkError } from '@/api/client';
import { showToast } from '@/store/toast.store';
import { useUpdateStore } from '@/store/update.store';
import { useDriverMe } from '@/hooks/useDriverMe';
import { useActiveTrip } from '@/hooks/useActiveTrip';

/**
 * The driver creates a trip after leaving: RPS / trip number, dispatch time, from, to, TAT, the odometer with its
 * photo and the trip sheet photo. It starts running at once and waits for the office to approve it; the office
 * adds the freight, vendor and touching points.
 */
export default function NewTripScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { me } = useDriverMe();
  const { refresh } = useActiveTrip();

  const [tripNumber, setTripNumber] = useState('');
  const [dispatch, setDispatch] = useState(new Date());
  const [tat, setTat] = useState('');
  const [odometer, setOdometer] = useState('');
  const [odoPhoto, setOdoPhoto] = useState<string | null>(null);
  const [sheetPhoto, setSheetPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vehicle = me?.currentVehicle ?? null;
  const minimum = vehicle?.odometerReading ?? 0;

  const submit = async (): Promise<void> => {
    if (busy) return;
    setError(null);
    const km = Number(odometer);
    const tatHours = Number(tat.replace(',', '.'));
    if (!tripNumber.trim()) return setError('Enter the RPS / trip number from the trip sheet');
    if (!Number.isFinite(tatHours) || tatHours <= 0) return setError('Enter the TAT in hours (for example 36)');
    if (!odometer.trim() || !Number.isInteger(km) || km < 0) return setError('Enter the odometer reading in whole kilometres');
    if (km < minimum) return setError(`The odometer can’t be lower than the last reading (${minimum.toLocaleString('en-IN')} km)`);
    if (!odoPhoto) return setError('Take a photo of the odometer');
    if (!sheetPhoto) return setError('Take a photo of the trip sheet');

    setBusy(true);
    try {
      const trip = await tripsApi.createDriverTrip({
        tripNumber: tripNumber.trim(),
        dispatchTime: dispatch.toISOString(),
        tatHours,
        startOdometer: km,
      });
      // The trip exists now. If a photo does not go through (bad network), it can be added from the trip screen.
      const failed: string[] = [];
      for (const [kind, uri, name] of [
        ['start_odometer', odoPhoto, 'odometer photo'],
        ['trip_sheet', sheetPhoto, 'trip sheet photo'],
      ] as const) {
        try {
          await tripsApi.uploadAttachment(trip.id, kind, uri);
        } catch {
          failed.push(name);
        }
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({
        type: failed.length ? 'info' : 'success',
        message: failed.length ? `Trip created. Add the ${failed.join(' and ')} from the trip screen.` : 'Trip created. The office will approve it.',
      });
      void refresh();
      void useUpdateStore.getState().refreshActiveTrip();
      router.replace(`/trip/${trip.id}`);
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(isNetworkError(e) ? 'You need an internet connection to create the trip. Please try again when connected.' : errMessage(e, 'Could not create the trip'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <ScreenHeader title="Create trip" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]} keyboardShouldPersistTaps="handled">
          <View style={[styles.summary, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>
              {vehicle ? `Vehicle ${vehicle.vehicleNumber}` : 'No vehicle assigned to you yet'}
            </Text>
            <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>
              Use this when you have already left. The office is told and will approve the trip.
            </Text>
          </View>

          <Input label="RPS / trip number" value={tripNumber} onChangeText={setTripNumber} autoCapitalize="characters" placeholder="From the trip sheet" leftIcon="document-text-outline" />
          <DateTimeField label="Dispatch time" value={dispatch} onChange={setDispatch} />
          <Input label="TAT (hours)" value={tat} onChangeText={(v) => setTat(v.replace(/[^0-9.,]/g, ''))} keyboardType="decimal-pad" placeholder="e.g. 36" leftIcon="timer-outline" />
          <Input
            label="Odometer reading (km)"
            value={odometer}
            onChangeText={(v) => setOdometer(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder={minimum ? `Last reading ${minimum.toLocaleString('en-IN')}` : 'e.g. 125430'}
            leftIcon="speedometer-outline"
          />
          <PhotoField label="Photo of the odometer" uri={odoPhoto} onChange={setOdoPhoto} />
          <PhotoField label="Photo of the trip sheet" uri={sheetPhoto} onChange={setSheetPhoto} allowGallery />

          {error ? <Text style={{ color: st.danger, fontSize: fontSize.sm }}>{error}</Text> : null}

          <Button size="lg" fullWidth loading={busy} leftIcon="add-circle" onPress={() => void submit()}>
            Create trip
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  summary: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: 4 },
});
