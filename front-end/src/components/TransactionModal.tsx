import { X } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Transaction } from '../data/types';
import { colors, fonts, radius, shadow, spacing } from '../theme';
import { formatCategory, formatCurrency } from '../utils/format';

type TransactionModalProps = {
  transaction?: Transaction;
  onClose: () => void;
};

export function TransactionModal({ transaction, onClose }: TransactionModalProps) {
  return (
    <Modal animationType="fade" transparent visible={Boolean(transaction)} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Transaction</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <X color={colors.text} size={20} strokeWidth={2.4} />
            </Pressable>
          </View>
          {transaction ? (
            <View style={styles.content}>
              <Text style={styles.merchant}>{transaction.merchant}</Text>
              <Text style={styles.amount}>{formatCurrency(transaction.amount, transaction.currency)}</Text>
              <Detail label="Description" value={transaction.description} />
              <Detail label="Category" value={formatCategory(transaction.category)} />
              <Detail label="AI method" value={transaction.categoryMethod ?? 'Not categorised'} />
              <Detail label="Needs review" value={transaction.needsReview ? 'Yes' : 'No'} />
              <Detail label="Source ID" value={transaction.sourceTransactionId} />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(18, 18, 18, 0.36)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modal: {
    ...shadow,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 20,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  content: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  merchant: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 24,
  },
  amount: {
    color: colors.green,
    fontFamily: fonts.heading,
    fontSize: 32,
  },
  detail: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingBottom: spacing.sm,
  },
  label: {
    color: colors.textSoft,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },
  value: {
    color: colors.text,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    marginTop: 2,
  },
});
