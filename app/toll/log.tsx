import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, fontFamily, fontSize, fontWeight, radius, spacing, useColors } from '@/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Select, type SelectItem } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { DateField } from '@/components/ui/DateField';
import * as tollApi from '@/api/toll-logs.api';
import * as driverApi from '@/api/driver.api';
import { errMessage, isNetworkError } from '@/api/client';
import { addToQueue } from '@/utils/offline-queue';
import { useOfflineStore } from '@/store/offline.store';
import { showToast } from '@/store/toast.store';
import type { CreateTollLogBody } from '@/types/api.types';

export default function LogTollScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();

  const [amount, setAmount] = useState('');
  const [crossings, setCrossings] = useState(1);
  const [date, setDate] = useState<Date>(() => new Date());
  const [trips, setTrips] = useState<SelectItem[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(tripId ?? null);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await driverApi.getDriverMe();
        if (me.currentVehicle) setVehicleId(me.currentVehicle.id);
      } catch {
        /* D12 */
      }
      try {
        const tr = await driverApi.getSelectOptions('trips');
        setTrips(tr.map((o) => ({ value: o.value, label: o.label })));
      } catch {
        /* best-effort */
      }
    })();
  }, []);

  const submit = async (): Promise<void> => {
    setError(null);
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError('Enter the toll amount');

    const body: CreateTollLogBody = {
      totalTollAmount: amt,
      numberOfTollCrosses: crossings,
      tripId: selectedTrip,
      vehicleId,
    };

    setSubmitting(true);
    const queue = (): void => {
      addToQueue({ endpoint: '/api/toll-logs', method: 'POST', body: body as unknown as Record<string, unknown> });
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
      await tollApi.createTollLog(body);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({ type: 'success', message: 'Toll logged' });
      router.back();
    } catch (e) {
      if (isNetworkError(e)) queue();
      else setError(errMessage(e, 'Could not save toll'));
    } finally {
      setSubmitting(false);
    }
  };

  const step = (delta: number): void => {
    void Haptics.selectionAsync();
    setCrossings((n) => Math.max(1, Math.min(50, n + delta)));
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <ScreenHeader title="Log Toll" icon="close" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.label, { color: c.textSecondary }]}>Total Toll Amount</Text>
          <View style={[styles.amountBox, { borderColor: c.border, backgroundColor: c.bgSurface }]}>
            <Text style={[styles.currency, { color: c.textTertiary }]}>₹</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={c.textTertiary}
              style={[styles.amountInput, { color: c.textPrimary }]}
            />
          </View>

          <Text style={[styles.label, { color: c.textSecondary }]}>Number of Crossings</Text>
          <View style={styles.stepper}>
            <Pressable onPress={() => step(-1)} style={[styles.stepBtn, { backgroundColor: c.bgSunken }]}>
              <Ionicons name="remove" size={28} color={c.textPrimary} />
            </Pressable>
            <Text style={[styles.count, { color: c.textPrimary }]}>{crossings}</Text>
            <Pressable onPress={() => step(1)} style={[styles.stepBtn, { backgroundColor: c.bgSunken }]}>
              <Ionicons name="add" size={28} color={c.textPrimary} />
            </Pressable>
          </View>

          <Select
            label="Trip (optional)"
            value={selectedTrip}
            onChange={setSelectedTrip}
            options={trips}
            placeholder="Link to a trip"
            searchable
          />

          <DateField label="Date" value={date} onChange={setDate} />

          {error ? <Text style={[styles.error, { color: c.danger }]}>{error}</Text> : null}

          <Button size="lg" fullWidth onPress={submit} loading={submitting} leftIcon="save">
            Save Toll
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  currency: { fontFamily: fontFamily.mono, fontSize: fontSize.xxl, fontWeight: fontWeight.bold },
  amountInput: { fontFamily: fontFamily.mono, fontSize: 36, fontWeight: fontWeight.bold, minWidth: 120, textAlign: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  stepBtn: { width: 64, height: 64, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  count: { fontFamily: fontFamily.mono, fontSize: 32, fontWeight: fontWeight.bold, minWidth: 60, textAlign: 'center' },
  error: { fontSize: fontSize.sm },
});
