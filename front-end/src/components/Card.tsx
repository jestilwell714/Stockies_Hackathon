import type { ReactNode } from 'react';
import { StyleSheet, type ViewStyle, View } from 'react-native';

import { colors, radius, shadow, spacing } from '../theme';

type CardProps = {
  children: ReactNode;
  compact?: boolean;
  style?: ViewStyle;
};

export function Card({ children, compact = false, style }: CardProps) {
  return <View style={[styles.card, compact && styles.compact, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    ...shadow,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  compact: {
    padding: spacing.md,
  },
});
