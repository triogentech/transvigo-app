import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { brand, fontFamily, fontSize, fontWeight, radius, spacing, status as st, useColors } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DateTimeField } from '@/components/ui/DateTimeField';
import { PhotoField } from '@/components/trip/PhotoField';
import * as tripsApi from '@/api/trips.api';
import { errMessage } from '@/api/client';
import { LocationUnavailableError } from '@/utils/trip-capture';
import { CameraDeniedError, reportTouchingPoint, takeStampPhoto } from '@/utils/touching-report';
import { showToast } from '@/store/toast.store';
import { formatDateTime } from '@/utils/format';
import type { Trip, TouchingLocation } from '@/types/api.types';

const hm = (min: number): string => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`;
const clock = (iso: string): string => formatDateTime(iso);

/** Where the trip stands with the office: waiting, approved, or sent back with a note. */
export function ApprovalBanner({ trip }: { trip: Trip }) {
  const c = useColors();
  const closing = trip.currentStatus === 'completed';
  const state = closing ? trip.closeApproval : trip.startApproval;
  if (!state || state === 'approved') return null;
  const sentBack = state === 'needs_changes';
  return (
    <View style={[styles.banner, { borderColor: sentBack ? st.danger : brand.teal, backgroundColor: sentBack ? 'rgba(220,38,38,0.10)' : 'rgba(20,184,166,0.10)' }]}>
      <Ionicons name={sentBack ? 'alert-circle' : 'hourglass-outline'} size={20} color={sentBack ? st.danger : brand.teal} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: c.textPrimary, fontWeight: fontWeight.bold }}>
          {sentBack ? 'The office sent this back' : closing ? 'Closed — waiting for the office to approve' : 'Waiting for the office to approve this trip'}
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>
          {sentBack ? trip.approvalNote ?? 'Please check the details with the office.' : 'You can carry on with the trip meanwhile.'}
        </Text>
      </View>
    </View>
  );
}

/** Photos the driver still has to add to a trip they created (the upload did not go through, or was skipped). */
export function MissingPhotos({ trip, onDone }: { trip: Trip; onDone: () => void }) {
  const c = useColors();
  const [busy, setBusy] = useState<string | null>(null);
  if (!trip.createdByDriver || trip.currentStatus === 'completed') return null;
  const missing: Array<{ kind: tripsApi.AttachmentKind; label: string }> = [];
  if (!trip.startOdometerPhotoUrl) missing.push({ kind: 'start_odometer', label: 'odometer photo' });
  if (!trip.tripSheetPhotoUrl) missing.push({ kind: 'trip_sheet', label: 'trip sheet photo' });
  if (missing.length === 0) return null;

  const add = async (kind: tripsApi.AttachmentKind, uri: string): Promise<void> => {
    setBusy(kind);
    try {
      await tripsApi.uploadAttachment(trip.id, kind, uri);
      showToast({ type: 'success', message: 'Photo added' });
      onDone();
    } catch (e) {
      showToast({ type: 'error', message: errMessage(e, 'Could not upload the photo') });
    } finally {
      setBusy(null);
    }
  };
  return (
    <Card>
      <Text style={[styles.title, { color: c.textPrimary }]}>Photos still needed</Text>
      {missing.map((m) => (
        <View key={m.kind} style={{ opacity: busy === m.kind ? 0.5 : 1 }}>
          <PhotoField label={`Add the ${m.label}`} uri={null} onChange={(uri) => void add(m.kind, uri)} allowGallery={m.kind === 'trip_sheet'} />
        </View>
      ))}
    </Card>
  );
}

/**
 * The touching points the office added. The driver sees the next point only, with one button: "Reached" opens the
 * camera for the stamped trip sheet, then time and GPS are taken and the point is saved; "Left" is one tap.
 * The other points are listed small below.
 */
export function TouchingPoints({ trip, onChanged }: { trip: Trip; onChanged: () => void }) {
  const c = useColors();
  const points = (trip.touchingLocations ?? []).slice().sort((a, b) => a.sequence - b.sequence);
  const [busy, setBusy] = useState(false);
  const [earlier, setEarlier] = useState<Date | null>(null); // "Reached / Left earlier?": the time to use instead of now
  // The photo is kept when the location could not be read, so the driver does not shoot the sheet again.
  const [kept, setKept] = useState<{ pointId: string; stage: 'in' | 'out'; uri: string } | null>(null);
  if (trip.currentStatus !== 'in_transit' || points.length === 0) return null;

  const current = points.find((p) => !p.inTime || !p.outTime) ?? null;
  const stage: 'in' | 'out' = current && current.inTime ? 'out' : 'in';

  const run = async (point: TouchingLocation): Promise<void> => {
    if (busy) return;
    setBusy(true);
    try {
      // Reaching always takes the stamped-sheet photo; leaving only when no photo was ever taken for this point.
      let photoUri: string | null = null;
      if (stage === 'in' || !(point.inSheetPhotoUrl || point.outSheetPhotoUrl)) {
        photoUri = kept && kept.pointId === point.id && kept.stage === stage ? kept.uri : await takeStampPhoto();
        if (!photoUri) return; // the driver cancelled the camera: nothing is saved
      }
      try {
        await reportTouchingPoint({ tripId: trip.id, point, stage, time: earlier ?? undefined, photoUri });
      } catch (e) {
        if (e instanceof LocationUnavailableError) {
          if (photoUri) setKept({ pointId: point.id, stage, uri: photoUri });
          showToast({ type: 'error', message: e.reason === 'denied' ? 'Location permission is off for TransVigo. Turn it on to report this point.' : e.reason === 'disabled' ? 'Your phone location (GPS) is turned off. Turn it on to report this point.' : 'We could not get your location. Try again.' });
          return;
        }
        throw e;
      }
      setKept(null);
      setEarlier(null);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onChanged();
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast({ type: 'error', message: e instanceof CameraDeniedError ? 'Camera permission is needed to photograph the stamped trip sheet' : errMessage(e, 'Could not save this point') });
    } finally {
      setBusy(false);
    }
  };

  const detail = (p: TouchingLocation) => (
    <>
      {p.inTime ? (
        <Text style={{ color: c.textSecondary, fontSize: fontSize.sm, fontFamily: fontFamily.mono }}>
          In {clock(p.inTime)}{p.outTime ? `  ·  Out ${clock(p.outTime)}  ·  Halt ${hm(Math.round((new Date(p.outTime).getTime() - new Date(p.inTime).getTime()) / 60000))}` : '  ·  still here'}
        </Text>
      ) : null}
      {p.inTime ? (
        <Text style={{ color: c.textTertiary, fontSize: fontSize.xs }}>
          {p.inLatitude != null || p.outLatitude != null ? 'Location saved' : 'No location'} · {p.inSheetPhotoUrl || p.outSheetPhotoUrl ? 'Stamped sheet added' : 'No stamped sheet yet'}
        </Text>
      ) : null}
    </>
  );

  const others = points.filter((p) => p.id !== current?.id);
  return (
    <Card>
      <Text style={[styles.title, { color: c.textPrimary }]}>Touching points</Text>
      {current ? (
        <View style={{ gap: spacing.sm }}>
          <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>{stage === 'in' ? 'Next stop' : 'You are at'}</Text>
          <Text style={{ color: c.textPrimary, fontSize: fontSize.xl, fontWeight: fontWeight.bold }}>{current.sequence}. {current.name ?? 'Touching point'}</Text>
          {detail(current)}
          <Button size="lg" fullWidth loading={busy} leftIcon={stage === 'in' ? 'camera' : 'exit-outline'} onPress={() => void run(current)}>
            {stage === 'in' ? 'Reached' : 'Left'}
          </Button>
          {stage === 'in' ? <Text style={{ color: c.textSecondary, fontSize: fontSize.xs }}>The camera opens for the stamped trip sheet. Your location and the time are saved with it.</Text> : null}
          {earlier ? (
            <DateTimeField label={stage === 'in' ? 'Reached at' : 'Left at'} value={earlier} onChange={setEarlier} />
          ) : (
            <Pressable onPress={() => setEarlier(new Date())} hitSlop={8}>
              <Text style={{ color: brand.teal, fontSize: fontSize.sm, fontWeight: fontWeight.semibold }}>{stage === 'in' ? 'Reached earlier?' : 'Left earlier?'}</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>All touching points are done. The halt time is worked out for you.</Text>
      )}
      {others.map((p) => (
        <View key={p.id} style={[styles.pointRow, { borderBottomColor: c.border, opacity: p.inTime ? 1 : 0.55 }]}>
          <Text style={{ color: c.textPrimary, fontWeight: fontWeight.semibold }}>{p.sequence}. {p.name ?? 'Touching point'}</Text>
          {detail(p)}
        </View>
      ))}
      {(trip.haltMinutes ?? 0) > 0 ? <Text style={{ color: c.textPrimary, fontWeight: fontWeight.semibold }}>Total halt: {hm(trip.haltMinutes ?? 0)}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', borderWidth: 1, borderRadius: radius.lg, padding: spacing.md },
  title: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  pointRow: { paddingVertical: spacing.sm, gap: 4, borderBottomWidth: StyleSheet.hairlineWidth },
});
