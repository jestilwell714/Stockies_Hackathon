import { Coffee, ShoppingBag, Utensils, WalletCards } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Transaction } from '../data/types';
import { colors, fonts, spacing } from '../theme';
import { formatCategory, formatCurrency, formatRelativeTime } from '../utils/format';

type TransactionCardProps = {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
};

const iconFor = (category?: string) => {
  if (category === 'eating_out') return Utensils;
  if (category === 'clothing') return ShoppingBag;
  if (category === 'subscriptions') return WalletCards;
  return Coffee;
};

export function TransactionCard({ transaction, onPress }: TransactionCardProps) {
  const Icon = iconFor(transaction.category);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress?.(transaction)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, transaction.isBadSpend ? styles.badIcon : styles.goodIcon]}>
        <Icon color={transaction.isBadSpend ? colors.green : colors.textSoft} size={18} strokeWidth={2.4} />
      </View>
      <View style={styles.main}>
        <Text style={styles.merchant}>{transaction.merchant}</Text>
        <Text style={styles.meta}>
          {formatCategory(transaction.category)} · {formatRelativeTime(transaction.timestamp)}
        </Text>
      </View>
      <Text style={styles.amount}>{formatCurrency(transaction.amount, transaction.currency)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.62,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 18,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  badIcon: {
    backgroundColor: colors.mint,
  },
  goodIcon: {
    backgroundColor: colors.surfaceAlt,
  },
  main: {
    flex: 1,
  },
  merchant: {
    color: colors.text,
    fontFamily: fonts.bodySemi,
    fontSize: 16,
  },
  meta: {
    color: colors.textSoft,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  amount: {
    color: colors.text,
    fontFamily: fonts.bodySemi,
    fontSize: 16,
  },
});
