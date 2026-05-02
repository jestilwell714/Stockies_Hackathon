import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '../theme';

type ProfileStatCardProps = {
  label: string;
  value: string;
  tone?: 'mint' | 'blue' | 'peach';
};

const toneColor = {
  mint: colors.mint,
  blue: colors.blue,
  peach: colors.peach,
};

export function ProfileStatCard({ label, value, tone = 'mint' }: ProfileStatCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: toneColor[tone] }]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: radius.md,
    flex: 1,
    justifyContent: 'center',
    minHeight: 92,
    padding: spacing.md,
  },
  value: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 20,
    textAlign: 'center',
  },
  label: {
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
