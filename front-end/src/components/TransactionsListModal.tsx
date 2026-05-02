import { X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Transaction } from '../data/types';
import { colors, fonts, radius, shadow, spacing } from '../theme';
import { TransactionCard } from './TransactionCard';

type TransactionsListModalProps = {
  transactions: Transaction[];
  visible: boolean;
  onClose: () => void;
};

export function TransactionsListModal({ transactions, visible, onClose }: TransactionsListModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>All Transactions</Text>
              <Text style={styles.subtitle}>{transactions.length} recent items</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <X color={colors.text} size={20} strokeWidth={2.4} />
            </Pressable>
          </View>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {transactions.map((transaction) => (
              <TransactionCard key={transaction.id} transaction={transaction} />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(18, 18, 18, 0.36)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modal: {
    ...shadow,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    maxHeight: '78%',
    padding: spacing.lg,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 22,
  },
  subtitle: {
    color: colors.textSoft,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  list: {
    marginBottom: -spacing.sm,
  },
});
