import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, fontFamily, fontSize, fontWeight, radius, spacing, useColors } from '@/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { Select, type SelectItem } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { DateField } from '@/components/ui/DateField';
import * as fuelApi from '@/api/fuel-logs.api';
import * as driverApi from '@/api/driver.api';
import { errMessage, isNetworkError } from '@/api/client';
import { addToQueue } from '@/utils/offline-queue';
import { useOfflineStore } from '@/store/offline.store';
import { showToast } from '@/store/toast.store';
import { formatCurrency } from '@/utils/format';
import type { CreateFuelLogBody, FuelType } from '@/types/api.types';

const FUEL_TYPES: FuelType[] = ['diesel', 'petrol', 'gas'];

export default function LogFuelScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();

  const [vehicle, setVehicle] = useState<{ id: string; vehicleNumber: string } | null>(null);
  const [stations, setStations] = useState<SelectItem[]>([]);
  const [trips, setTrips] = useState<SelectItem[]>([]);

  const [date, setDate] = useState<Date>(() => new Date());
  const [stationId, setStationId] = useState<string | null>(null);
  const [fuelType, setFuelType] = useState<FuelType>('diesel');
  const [qty, setQty] = useState('');
  const [rate, setRate] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<string | null>(tripId ?? null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await driverApi.getDriverMe();
        if (me.currentVehicle) setVehicle({ id: me.currentVehicle.id, vehicleNumber: me.currentVehicle.vehicleNumber });
      } catch {
        /* /api/driver/me arrives in D12 */
      }
      try {
        const [st, tr] = await Promise.all([
          driverApi.getSelectOptions('fuel-stations'),
          driverApi.getSelectOptions('trips'),
        ]);
        setStations(st.map((o) => ({ value: o.value, label: o.label })));
        setTrips(tr.map((o) => ({ value: o.value, label: o.label })));
      } catch {
        /* selects best-effort */
      }
    })();
  }, []);

  const total = (Number(qty) || 0) * (Number(rate) || 0);

  const takePhoto = async (): Promise<void> => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      showToast({ type: 'error', message: 'Camera permission denied' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const submit = async (): Promise<void> => {
    setError(null);
    const quantity = Number(qty);
    const ratePerL = Number(rate);
    if (!quantity || quantity <= 0) return setError('Enter the fuel quantity');
    if (!ratePerL || ratePerL <= 0) return setError('Enter the rate per litre');

    const body: CreateFuelLogBody = {
      date: date.toISOString(),
      fuelQuantityLtr: quantity,
      fuelType,
      rate: ratePerL,
      amount: Math.round(total * 100) / 100,
      vehicleId: vehicle?.id ?? null,
      tripId: selectedTrip,
      fuelStationId: stationId,
    };

    setSubmitting(true);
    const queue = (): void => {
      addToQueue({ endpoint: '/api/fuel-logs', method: 'POST', body: body as unknown as Record<string, unknown> });
      useOfflineStore.getState().refreshCount();
      showToast({ type: 'warning', message: 'Saved offline — will sync when connected' });
      router.back();
    };

    if (!useOfflineStore.getState().isOnline) {
      queue();
      setSubmitting(false);
      return;
    }
    try {
      await fuelApi.createFuelLog(body);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({ type: 'success', message: 'Fuel logged successfully' });
      router.back();
    } catch (e) {
      if (isNetworkError(e)) queue();
      else setError(errMessage(e, 'Could not save fuel log'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <ScreenHeader title="Log Fuel" icon="close" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.vehicleBox, { backgroundColor: c.bgSunken }]}>
            <Text style={[styles.vehicleLabel, { color: c.textTertiary }]}>VEHICLE</Text>
            <Text style={[styles.vehicleNumber, { color: brand.teal }]}>
              {vehicle?.vehicleNumber ?? 'Your assigned vehicle'}
            </Text>
          </View>

          <DateField label="Date" value={date} onChange={setDate} />

          <Select
            label="Fuel Station"
            value={stationId}
            onChange={setStationId}
            options={stations}
            placeholder="Select station (optional)"
            searchable
          />

          <View>
            <Text style={[styles.label, { color: c.textSecondary }]}>Fuel Type</Text>
            <View style={styles.typeRow}>
              {FUEL_TYPES.map((t) => {
                const active = fuelType === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setFuelType(t)}
                    style={[styles.typePill, { backgroundColor: active ? brand.navy : c.bgSurface, borderColor: active ? brand.navy : c.border }]}
                  >
                    <Text style={[styles.typeText, { color: active ? '#FFFFFF' : c.textSecondary }]}>
                      {t[0]!.toUpperCase() + t.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.qtyRow}>
            <View style={{ flex: 1 }}>
              <Input label="Quantity (L)" value={qty} onChangeText={setQty} keyboardType="decimal-pad" placeholder="0.00" style={styles.bigInput} />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Rate / L (₹)" value={rate} onChangeText={setRate} keyboardType="decimal-pad" placeholder="95.50" style={styles.bigInput} />
            </View>
          </View>

          <View style={[styles.totalBox, { backgroundColor: c.bgSunken }]}>
            <Text style={[styles.totalLabel, { color: c.textSecondary }]}>Total Amount</Text>
            <Text style={[styles.totalValue, { color: c.textPrimary }]}>{formatCurrency(total)}</Text>
          </View>

          <Select
            label="Trip (optional)"
            value={selectedTrip}
            onChange={setSelectedTrip}
            options={trips}
            placeholder="Link to a trip"
            searchable
          />

          <Pressable onPress={takePhoto} style={[styles.photoBtn, { borderColor: c.border }]}>
            <Ionicons name="camera-outline" size={20} color={c.textSecondary} />
            <Text style={[styles.photoText, { color: c.textSecondary }]}>
              {photoUri ? 'Retake odometer photo' : 'Take odometer photo (optional)'}
            </Text>
          </Pressable>
          {photoUri ? <Image source={{ uri: photoUri }} style={styles.thumb} /> : null}

          {error ? <Text style={[styles.error, { color: c.danger }]}>{error}</Text> : null}

          <Button size="lg" fullWidth onPress={submit} loading={submitting} leftIcon="save">
            Save Fuel Log
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  vehicleBox: { padding: spacing.md, borderRadius: radius.md },
  vehicleLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  vehicleNumber: { fontFamily: fontFamily.mono, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: spacing.xs },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typePill: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  typeText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  qtyRow: { flexDirection: 'row', gap: spacing.md },
  bigInput: { fontFamily: fontFamily.mono, fontSize: fontSize.xl },
  totalBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderRadius: radius.md },
  totalLabel: { fontSize: fontSize.sm },
  totalValue: { fontFamily: fontFamily.mono, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  photoText: { fontSize: fontSize.sm },
  thumb: { width: '100%', height: 160, borderRadius: radius.md },
  error: { fontSize: fontSize.sm },
});
