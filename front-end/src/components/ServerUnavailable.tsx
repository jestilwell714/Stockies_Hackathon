import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '../theme';

export function ServerUnavailable() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Server Unavaliable</Text>
      <Text style={styles.copy}>Start the Java backend and check EXPO_PUBLIC_SKIMP_API_URL.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 24,
    textAlign: 'center',
  },
  copy: {
    color: colors.textSoft,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    textAlign: 'center',
  },
});
