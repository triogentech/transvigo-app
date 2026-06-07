import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, fontWeight, radius, spacing, useColors } from '@/theme';
import { Button } from '@/components/ui/Button';

export function OpsModal({
  open, onClose, title, onSubmit, submitting, submitLabel = 'Save', children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  onSubmit: () => void;
  submitting?: boolean;
  submitLabel?: string;
  children: ReactNode;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: c.bgSurface, paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.head}>
              <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <Text style={{ color: c.textSecondary, fontSize: fontSize.md }}>Close</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.md }} keyboardShouldPersistTaps="handled">
              {children}
              <Button onPress={onSubmit} loading={submitting} fullWidth>{submitLabel}</Button>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, maxHeight: '88%' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
});
