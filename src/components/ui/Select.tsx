import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, fontWeight, radius, spacing, useColors } from '@/theme';
import { BottomSheet } from './BottomSheet';

export interface SelectItem {
  value: string;
  label: string;
}

interface SelectProps {
  value: string | null;
  onChange: (value: string) => void;
  options: SelectItem[];
  placeholder?: string;
  label?: string;
  searchable?: boolean;
  disabled?: boolean;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  label,
  searchable = false,
  disabled = false,
}: SelectProps) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((o) => o.value === value) ?? null;
  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <View>
      {label ? <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text> : null}
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.field, { backgroundColor: c.bgSurface, borderColor: c.border, opacity: disabled ? 0.5 : 1 }]}
      >
        <Text
          style={[styles.fieldText, { color: selected ? c.textPrimary : c.textTertiary }]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={c.textTertiary} />
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label ?? 'Select'} height={460}>
        {searchable ? (
          <View style={[styles.search, { backgroundColor: c.bgSunken }]}>
            <Ionicons name="search" size={16} color={c.textTertiary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search…"
              placeholderTextColor={c.textTertiary}
              style={[styles.searchInput, { color: c.textPrimary }]}
              autoCorrect={false}
            />
          </View>
        ) : null}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.value}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isSel = item.value === value;
            return (
              <Pressable
                style={styles.option}
                onPress={() => {
                  onChange(item.value);
                  setQuery('');
                  setOpen(false);
                }}
              >
                <Text style={[styles.optionText, { color: c.textPrimary }]} numberOfLines={1}>
                  {item.label}
                </Text>
                {isSel ? <Ionicons name="checkmark" size={18} color={c.success} /> : null}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: c.textTertiary }]}>No options</Text>
          }
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  fieldText: { flex: 1, fontSize: fontSize.md, marginRight: spacing.sm },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: fontSize.md, paddingVertical: spacing.sm, marginLeft: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  optionText: { flex: 1, fontSize: fontSize.md, marginRight: spacing.sm },
  empty: { textAlign: 'center', paddingVertical: spacing.xl, fontSize: fontSize.sm },
});
