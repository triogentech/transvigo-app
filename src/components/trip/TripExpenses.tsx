import { StyleSheet, Text, View } from 'react-native';
import { fontFamily, fontSize, fontWeight, spacing, status as st, useColors } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Transaction } from '@/types/api.types';

export function TripExpenses({ transactions }: { transactions: Transaction[] }) {
  const c = useColors();
  if (transactions.length === 0) {
    return <Text style={[styles.empty, { color: c.textTertiary }]}>No transactions for this trip</Text>;
  }
  return (
    <View>
      {transactions.map((t) => {
        const credit = t.type === 'credit';
        const amountColor = credit ? st.success : st.danger;
        return (
          <View key={t.id} style={[styles.row, { borderBottomColor: c.border }]}>
            <View style={styles.left}>
              <View style={[styles.pill, { backgroundColor: c.bgSunken }]}>
                <Text style={[styles.pillText, { color: c.textSecondary }]}>{t.txnTowards}</Text>
              </View>
              <Text style={[styles.date, { color: c.textTertiary }]}>{formatDate(t.createdAt)}</Text>
            </View>
            <Text style={[styles.amount, { color: amountColor }]}>
              {credit ? '+' : '−'}
              {formatCurrency(t.amount)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 6 },
  pillText: { fontSize: fontSize.xs },
  date: { fontSize: fontSize.xs },
  amount: { fontFamily: fontFamily.mono, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  empty: { fontSize: fontSize.sm, paddingVertical: spacing.md },
});
