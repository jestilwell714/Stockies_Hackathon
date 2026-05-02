import { StyleSheet, Text, View } from 'react-native';

import type { SkimpApiError } from '../data/types';
import { colors, fonts, spacing } from '../theme';

type ServerUnavailableProps = {
  error?: unknown;
};

export function ServerUnavailable({ error }: ServerUnavailableProps) {
  const debug = (error as SkimpApiError | undefined)?.debug;
  const message = error instanceof Error ? error.message : undefined;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Server Unavaliable</Text>
      <Text style={styles.copy}>Start the Java backend and check EXPO_PUBLIC_SKIMP_API_URL.</Text>
      {debug ? (
        <View style={styles.debugBox}>
          <Text style={styles.debugText}>URL: {debug.url}</Text>
          <Text style={styles.debugText}>Method: {debug.method}</Text>
          <Text style={styles.debugText}>Platform: {debug.platform}</Text>
          {debug.status ? <Text style={styles.debugText}>Status: {debug.status} {debug.statusText}</Text> : null}
          {debug.configuredApiBaseUrl ? <Text style={styles.debugText}>Env: {debug.configuredApiBaseUrl}</Text> : null}
          {debug.inferredApiBaseUrl ? <Text style={styles.debugText}>Inferred: {debug.inferredApiBaseUrl}</Text> : null}
          {debug.causeMessage ? <Text style={styles.debugText}>Cause: {debug.causeMessage}</Text> : null}
        </View>
      ) : message ? (
        <Text style={styles.debugText}>{message}</Text>
      ) : null}
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
  debugBox: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    marginTop: spacing.md,
    maxWidth: 340,
    padding: spacing.md,
    width: '100%',
  },
  debugText: {
    color: colors.textSoft,
    fontFamily: fonts.body,
    fontSize: 11,
  },
});
