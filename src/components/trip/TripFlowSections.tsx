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
import { getCurrentCoords, LocationUnavailableError } from '@/utils/trip-capture';
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

/** The touching points the office added: report when you reach and when you leave each one. */
export function TouchingPoints({ trip, onChanged }: { trip: Trip; onChanged: () => void }) {
  const c = useColors();
  const points = (trip.touchingLocations ?? []).slice().sort((a, b) => a.sequence - b.sequence);
  const [open, setOpen] = useState<{ id: string; stage: 'in' | 'out'; time: Date; photo: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  if (trip.currentStatus !== 'in_transit' || points.length === 0) return null;

  const confirm = async (): Promise<void> => {
    if (!open || busy) return;
    const point = points.find((p) => p.id === open.id);
    // Leaving needs the stamped trip sheet (taken now, or already added when reaching).
    if (open.stage === 'out' && !open.photo && !point?.inSheetPhotoUrl && !point?.outSheetPhotoUrl) {
      showToast({ type: 'error', message: 'Add a photo of the stamped trip sheet before you leave' });
      return;
    }
    setBusy(true);
    try {
      // Where you are: needed every time. Without location the point cannot be reported.
      let coords;
      try {
        coords = await getCurrentCoords();
      } catch (e) {
        if (e instanceof LocationUnavailableError) {
          showToast({ type: 'error', message: e.reason === 'denied' ? 'Location permission is off for TransVigo. Turn it on to report this point.' : e.reason === 'disabled' ? 'Your phone location (GPS) is turned off. Turn it on to report this point.' : 'We could not get your location. Try again.' });
          return;
        }
        throw e;
      }
      if (open.photo) await tripsApi.uploadTouchingPhoto(trip.id, open.id, open.stage, open.photo);
      await tripsApi.reportTouching(trip.id, open.id, open.stage, open.time, coords);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setOpen(null);
      onChanged();
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast({ type: 'error', message: errMessage(e, 'Could not save the time') });
    } finally {
      setBusy(false);
    }
  };

  const row = (p: TouchingLocation) => {
    const editing = open?.id === p.id ? open : null;
    return (
      <View key={p.id} style={[styles.pointRow, { borderBottomColor: c.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
          <Text style={{ color: c.textPrimary, fontWeight: fontWeight.semibold, flex: 1 }}>{p.sequence}. {p.name ?? 'Touching point'}</Text>
          {!p.inTime ? (
            <Button size="sm" variant="secondary" onPress={() => setOpen({ id: p.id, stage: 'in', time: new Date(), photo: null })}>Reached</Button>
          ) : !p.outTime ? (
            <Button size="sm" variant="secondary" onPress={() => setOpen({ id: p.id, stage: 'out', time: new Date(), photo: null })}>Left</Button>
          ) : null}
        </View>
        {p.inTime ? (
          <Text style={{ color: c.textTertiary, fontSize: fontSize.xs }}>
            {p.inLatitude != null || p.outLatitude != null ? 'Location saved' : 'No location'} · {p.inSheetPhotoUrl || p.outSheetPhotoUrl ? 'Stamped sheet added' : 'No stamped sheet yet'}
          </Text>
        ) : null}
        {p.inTime ? (
          <Text style={{ color: c.textSecondary, fontSize: fontSize.sm, fontFamily: fontFamily.mono }}>
            In {clock(p.inTime)}{p.outTime ? `  ·  Out ${clock(p.outTime)}  ·  Halt ${hm(Math.round((new Date(p.outTime).getTime() - new Date(p.inTime).getTime()) / 60000))}` : '  ·  still here'}
          </Text>
        ) : null}
        {editing ? (
          <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
            <DateTimeField label={editing.stage === 'in' ? 'Reached at' : 'Left at'} value={editing.time} onChange={(t) => setOpen({ ...editing, time: t })} />
            <PhotoField
              label={editing.stage === 'in' ? 'Stamped trip sheet photo (add it now, or when you leave)' : (p.inSheetPhotoUrl || p.outSheetPhotoUrl ? 'Stamped trip sheet photo (already added, add another if you like)' : 'Stamped trip sheet photo (required)')}
              uri={editing.photo}
              onChange={(uri) => setOpen({ ...editing, photo: uri })}
              allowGallery
            />
            <Text style={{ color: c.textSecondary, fontSize: fontSize.xs }}>Your location is recorded when you save.</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button size="sm" variant="ghost" onPress={() => setOpen(null)} style={{ flex: 1 }}>Cancel</Button>
              <Button size="sm" loading={busy} onPress={() => void confirm()} style={{ flex: 1 }}>{editing.stage === 'in' ? 'Save reached time' : 'Save left time'}</Button>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <Card>
      <Text style={[styles.title, { color: c.textPrimary }]}>Touching points</Text>
      <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>Report when you reach each point and when you leave it. The halt time is worked out for you.</Text>
      {points.map(row)}
      {(trip.haltMinutes ?? 0) > 0 ? <Text style={{ color: c.textPrimary, fontWeight: fontWeight.semibold }}>Total halt: {hm(trip.haltMinutes ?? 0)}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', borderWidth: 1, borderRadius: radius.lg, padding: spacing.md },
  title: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  pointRow: { paddingVertical: spacing.sm, gap: 4, borderBottomWidth: StyleSheet.hairlineWidth },
});
