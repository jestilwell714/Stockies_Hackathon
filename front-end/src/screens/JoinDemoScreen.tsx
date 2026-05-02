import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ServerUnavailable } from '../components/ServerUnavailable';
import type { DemoSession, SkimpDataAdapter } from '../data/types';
import { colors, fonts, radius, shadow, spacing } from '../theme';

type JoinDemoScreenProps = {
  adapter: SkimpDataAdapter;
  onJoin(session: DemoSession): void;
  onResetSession?: () => void;
};

export function JoinDemoScreen({ adapter, onJoin, onResetSession }: JoinDemoScreenProps) {
  const [displayName, setDisplayName] = useState('');
  const [joining, setJoining] = useState(false);
  const [serverError, setServerError] = useState<unknown>();
  const canJoin = displayName.trim().length >= 2 && !joining;

  const join = async () => {
    if (!canJoin) {
      return;
    }

    setJoining(true);
    setServerError(undefined);
    try {
      const session = await adapter.joinDemo(displayName);
      onJoin(session);
    } catch (error) {
      setServerError(error);
    } finally {
      setJoining(false);
    }
  };

  if (serverError) {
    return <ServerUnavailable error={serverError} onResetSession={onResetSession} />;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <View style={styles.panel}>
        <Text style={styles.brand}>Skimp</Text>
        <Text style={styles.title}>Join your demo team</Text>
        <Text style={styles.subtitle}>Enter your name and we will place you into a live group.</Text>

        <TextInput
          autoCapitalize="words"
          autoCorrect={false}
          onChangeText={setDisplayName}
          onSubmitEditing={join}
          placeholder="Your name"
          placeholderTextColor={colors.muted}
          returnKeyType="join"
          style={styles.input}
          value={displayName}
        />

        <Pressable
          accessibilityRole="button"
          disabled={!canJoin}
          onPress={join}
          style={({ pressed }) => [styles.button, pressed && styles.pressed, !canJoin && styles.disabled]}
        >
          {joining ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.buttonText}>Join Team</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    maxWidth: 420,
    padding: spacing.xl,
    width: '100%',
    ...shadow,
  },
  brand: {
    color: colors.green,
    fontFamily: fonts.heading,
    fontSize: 20,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 30,
  },
  subtitle: {
    color: colors.textSoft,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fonts.bodySemi,
    fontSize: 18,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: radius.md,
    minHeight: 56,
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.surface,
    fontFamily: fonts.bodySemi,
    fontSize: 16,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.5,
  },
});
