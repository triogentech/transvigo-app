import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brand, fontSize, fontWeight, radius, spacing, useColors } from '@/theme';
import { formatDateTime } from '@/utils/format';
import type { ThreadMessage } from '@/types/maintenance.types';

interface Props {
  messages: ThreadMessage[];
  /** Whose app this is: "mine" are the messages sent by that side. */
  viewer: 'driver' | 'ops';
  /** When set, the composer is replaced by this note (e.g. "This report is resolved"). */
  closedNote?: string;
  onSend: (body: string) => Promise<void>;
}

/** Chat-style thread between the driver and the back office, with a composer. */
export function MessageThread({ messages, viewer, closedNote, onSend }: Props) {
  const c = useColors();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const send = async (): Promise<void> => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await onSend(body);
      setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={{ gap: spacing.md }}>
      {messages.length === 0 ? (
        <Text style={{ color: c.textTertiary, fontSize: fontSize.sm }}>
          {viewer === 'driver' ? 'No messages yet. The office will reply here.' : 'No messages yet. Your first message acknowledges the report.'}
        </Text>
      ) : (
        messages.map((m) => {
          const mine = viewer === 'driver' ? m.fromDriver : !m.fromDriver;
          return (
            <View key={m.id} style={[styles.bubbleWrap, { alignItems: mine ? 'flex-end' : 'flex-start' }]}>
              <View style={[styles.bubble, mine ? { backgroundColor: brand.navy } : { backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border }]}>
                <Text style={{ color: mine ? '#fff' : c.textPrimary, fontSize: fontSize.md }}>{m.body}</Text>
              </View>
              <Text style={{ color: c.textTertiary, fontSize: 11 }}>
                {mine ? 'You' : m.fromDriver ? 'Driver' : m.senderName} · {formatDateTime(m.createdAt)}
              </Text>
            </View>
          );
        })
      )}

      {closedNote ? (
        <Text style={{ color: c.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold }}>{closedNote}</Text>
      ) : (
        <View style={[styles.composer, { backgroundColor: c.bgSurface, borderColor: c.border }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write a message"
            placeholderTextColor={c.textTertiary}
            multiline
            maxLength={2000}
            style={[styles.input, { color: c.textPrimary }]}
          />
          <Pressable onPress={() => void send()} disabled={!text.trim() || sending} hitSlop={8} accessibilityLabel="Send message">
            {sending ? <ActivityIndicator color={brand.teal} /> : <Ionicons name="send" size={22} color={text.trim() ? brand.teal : c.textTertiary} />}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleWrap: { gap: 2 },
  bubble: { maxWidth: '85%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  input: { flex: 1, maxHeight: 110, minHeight: 36, fontSize: fontSize.md, paddingTop: 6 },
});
