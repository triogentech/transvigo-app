import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontSize, fontWeight, radius, spacing, status as st, useColors } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { OpsListScaffold } from '@/components/ops/OpsListScaffold';
import { VendorFormModal } from '@/components/ops/VendorFormModal';
import { Pill } from '@/components/maintenance/ReportMeta';
import { errMessage } from '@/api/client';
import * as ops from '@/api/ops.api';
import { VENDOR_TYPES, type Vendor, type VendorType } from '@/types/vendors.types';

const TYPE_COLOR: Record<VendorType, string> = { load_provider: '#2563EB', garage: '#7C3AED', spare_parts: '#16A34A' };

/** All vendors in one place: load provider vendors, garages / workshops and spare parts vendors, each with its code. */
export default function OpsVendors() {
  const c = useColors();
  const [type, setType] = useState<VendorType | null>(null);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<Vendor[]>([]);
  const [counts, setCounts] = useState<Record<VendorType, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{ open: boolean; vendor: Vendor | null }>({ open: false, vendor: null });

  const load = useCallback(async () => {
    try {
      const r = await ops.getVendors(type ?? undefined, search.trim() || undefined);
      setItems(r.data);
      setCounts(r.counts);
      setError(null);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, [type, search]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250); // debounce the search box
    return () => clearTimeout(t);
  }, [load]);

  return (
    <OpsListScaffold title="Vendors" loading={loading} error={error} empty={items.length === 0} onRefresh={load} onAdd={() => setForm({ open: true, vendor: null })}>
      <View style={styles.chips}>
        {[{ value: null, label: 'All' } as { value: VendorType | null; label: string }, ...VENDOR_TYPES].map((t) => {
          const active = type === t.value;
          const n = t.value ? counts?.[t.value] : counts ? counts.load_provider + counts.garage + counts.spare_parts : undefined;
          return (
            <Pressable key={t.label} onPress={() => setType(t.value)} style={[styles.chip, { borderColor: active ? st.info : c.border, backgroundColor: active ? `${st.info}22` : c.bgSurface }]}>
              <Text style={{ color: active ? st.info : c.textPrimary, fontSize: fontSize.xs, fontWeight: fontWeight.semibold }}>
                {t.label.replace(' vendor', '')}{n !== undefined ? ` (${n})` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Input value={search} onChangeText={setSearch} placeholder="Search by name or code" leftIcon="search-outline" autoCapitalize="none" />

      {items.map((v) => (
        <Pressable key={v.id} onPress={() => setForm({ open: true, vendor: v })}>
          <Card style={v.isActive ? styles.card : { ...styles.card, opacity: 0.55 }}>
            <View style={styles.row}>
              <Text style={[styles.name, { color: c.textPrimary }]} numberOfLines={1}>{v.name}</Text>
              <Text style={[styles.code, { color: c.textSecondary }]}>{v.vendorCode}</Text>
            </View>
            <View style={styles.row}>
              <Pill label={v.typeLabel} color={TYPE_COLOR[v.type]} />
              {!v.isActive ? <Pill label="Inactive" color="#9CA3AF" /> : null}
            </View>
            {v.contactPerson || v.contactNumber ? (
              <Text style={{ color: c.textSecondary, fontSize: fontSize.sm }}>{[v.contactPerson, v.contactNumber].filter(Boolean).join(' · ')}</Text>
            ) : null}
            {v.outstandingCredit ? <Text style={{ color: st.warning, fontSize: fontSize.xs }}>Outstanding credit ₹{v.outstandingCredit.toLocaleString('en-IN')}</Text> : null}
          </Card>
        </Pressable>
      ))}

      <VendorFormModal open={form.open} vendor={form.vendor} onClose={() => setForm({ open: false, vendor: null })} onSaved={() => void load()} />
    </OpsListScaffold>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
  card: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  name: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  code: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
});
