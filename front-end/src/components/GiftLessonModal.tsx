import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getGiftCooldownRemainingMs,
  getLastGiftUnboxedAtMs,
  setLastGiftUnboxedAtMs,
} from '../data/giftCooldown';
import { financeLessons, pickRandomLesson, type FinanceLesson, type LessonRank } from '../data/financeLessons';
import { colors, fonts, radius, shadow, spacing } from '../theme';

type GiftLessonModalProps = {
  visible: boolean;
  onClose: () => void;
};

type Phase = 'cooldown' | 'closed' | 'opening' | 'revealed';

const SPARKLE_COUNT = 8;
const SPARKLE_DISTANCE = 96;

/** Tier-list flavoured colour mapping for the rank badge (S → gold, D → coral). */
const RANK_PALETTE: Record<LessonRank, { bg: string; text: string }> = {
  S: { bg: colors.yellow, text: '#8A6D00' },
  A: { bg: colors.mint, text: colors.green },
  B: { bg: colors.blue, text: colors.blueStrong },
  C: { bg: colors.peach, text: '#B14A2A' },
  D: { bg: colors.coral, text: '#7A1F1F' },
};

export function GiftLessonModal({ visible, onClose }: GiftLessonModalProps) {
  const [phase, setPhase] = useState<Phase>('closed');
  const [lesson, setLesson] = useState<FinanceLesson>(() => financeLessons[0]);
  /** False until `@skimp/last_daily_gift_unboxed_at_ms` is read (avoids a wrong frame). */
  const [giftReady, setGiftReady] = useState(false);
  const [lastUnboxedAtMs, setLastUnboxedAtMs] = useState<number | null>(null);
  /** Bumps once per second while on cooldown so the countdown label updates live. */
  const [, setCooldownTick] = useState(0);

  const bob = useRef(new Animated.Value(0)).current;
  const boxRotate = useRef(new Animated.Value(0)).current;
  const lidY = useRef(new Animated.Value(0)).current;
  const lidRotate = useRef(new Animated.Value(0)).current;
  const lidOpacity = useRef(new Animated.Value(1)).current;
  const bodyOpacity = useRef(new Animated.Value(1)).current;
  const sparkles = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.7)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(24)).current;

  const phaseRef = useRef<Phase>('closed');
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const resetAnimatedValues = useCallback(() => {
    bob.setValue(0);
    boxRotate.setValue(0);
    lidY.setValue(0);
    lidRotate.setValue(0);
    lidOpacity.setValue(1);
    bodyOpacity.setValue(1);
    sparkles.setValue(0);
    cardScale.setValue(0.7);
    cardOpacity.setValue(0);
    cardY.setValue(24);
  }, [bob, boxRotate, lidY, lidRotate, lidOpacity, bodyOpacity, sparkles, cardScale, cardOpacity, cardY]);

  /** Load cooldown + initialise phase whenever the modal opens. */
  useEffect(() => {
    if (!visible) {
      setGiftReady(false);
      return;
    }

    resetAnimatedValues();
    setGiftReady(false);
    let cancelled = false;

    (async () => {
      const stored = await getLastGiftUnboxedAtMs();
      if (cancelled) {
        return;
      }

      setLastUnboxedAtMs(stored);

      const remaining = getGiftCooldownRemainingMs(stored);
      const nextPhase: Phase = remaining > 0 ? 'cooldown' : 'closed';
      setPhase(nextPhase);
      if (remaining === 0) {
        bob.setValue(0);
      }
      setGiftReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, resetAnimatedValues, bob]);

  /** Tick countdown while cooling down; flip to playable when window ends. */
  useEffect(() => {
    if (!visible || phase !== 'cooldown' || lastUnboxedAtMs === null) {
      return;
    }
    const interval = setInterval(() => {
      setCooldownTick((t) => t + 1);
      const rem = getGiftCooldownRemainingMs(lastUnboxedAtMs);
      if (rem <= 0) {
        resetAnimatedValues();
        bob.setValue(0);
        setPhase('closed');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [visible, phase, lastUnboxedAtMs, bob, resetAnimatedValues]);

  /** Idle bob loop while box is closed; cancels on phase change or unmount. */
  useEffect(() => {
    if (phase !== 'closed' || !visible) {
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [phase, visible, bob]);

  const handleOpenBox = () => {
    if (phaseRef.current !== 'closed') {
      return;
    }
    const next = pickRandomLesson(lesson?.id);
    setLesson(next);
    setPhase('opening');
    bob.stopAnimation();
    bob.setValue(0);

    Animated.sequence([
      Animated.sequence([
        Animated.timing(boxRotate, { toValue: -1, duration: 70, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(boxRotate, { toValue: 1, duration: 90, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(boxRotate, { toValue: -0.5, duration: 70, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(boxRotate, { toValue: 0, duration: 60, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(lidY, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(lidRotate, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(lidOpacity, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(sparkles, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(180),
          Animated.timing(bodyOpacity, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(220),
          Animated.parallel([
            Animated.timing(cardScale, { toValue: 1, duration: 380, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true }),
            Animated.timing(cardOpacity, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(cardY, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
        ]),
      ]),
    ]).start(({ finished }) => {
      if (finished) {
        const unlockedAt = Date.now();
        setLastUnboxedAtMs(unlockedAt);
        void setLastGiftUnboxedAtMs(unlockedAt);
        setPhase('revealed');
      }
    });
  };

  const handleClose = () => {
    bob.stopAnimation();
    boxRotate.stopAnimation();
    lidY.stopAnimation();
    lidRotate.stopAnimation();
    lidOpacity.stopAnimation();
    bodyOpacity.stopAnimation();
    sparkles.stopAnimation();
    cardScale.stopAnimation();
    cardOpacity.stopAnimation();
    cardY.stopAnimation();
    onClose();
  };

  const bobTranslate = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const boxRotateDeg = boxRotate.interpolate({ inputRange: [-1, 1], outputRange: ['-7deg', '7deg'] });
  const lidTranslateY = lidY.interpolate({ inputRange: [0, 1], outputRange: [0, -130] });
  const lidRotateDeg = lidRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-22deg'] });

  const isInteractiveBox = phase === 'closed';

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel="Close gift" style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Sparkles color={colors.green} size={18} strokeWidth={2.4} />
              <Text style={styles.title}>Daily lesson</Text>
            </View>
            <Pressable accessibilityLabel="Close" accessibilityRole="button" onPress={handleClose} style={styles.closeButton}>
              <X color={colors.text} size={18} strokeWidth={2.4} />
            </Pressable>
          </View>

          {!giftReady ? (
            <View style={styles.bootstrapping}>
              <ActivityIndicator accessibilityLabel="Loading gift lesson" color={colors.green} size="large" />
            </View>
          ) : phase === 'cooldown' ? (
            <View style={styles.stage}>
              <View pointerEvents="none" style={styles.cooldownGiftWrap}>
                <GiftBoxClosedStill />
              </View>
              <Text style={styles.cooldownTitle}>Your next daily lesson unlocks in</Text>
              <Text style={styles.countdownBig}>{formatCooldownLabel(getGiftCooldownRemainingMs(lastUnboxedAtMs))}</Text>
              <Text style={styles.tapHint}>Come back once 24 hours have passed.</Text>
            </View>
          ) : phase !== 'revealed' ? (
            <View style={styles.stage}>
              <Pressable
                accessibilityHint={isInteractiveBox ? 'Tap to open and reveal a finance lesson' : undefined}
                accessibilityLabel="Open gift box"
                accessibilityRole="button"
                disabled={!isInteractiveBox}
                onPress={handleOpenBox}
                style={styles.stagePress}
              >
                <Animated.View
                  style={[
                    styles.boxAnchor,
                    { transform: [{ translateY: bobTranslate }, { rotateZ: boxRotateDeg }] },
                  ]}
                >
                  {Array.from({ length: SPARKLE_COUNT }).map((_, i) => {
                    const angle = (i / SPARKLE_COUNT) * Math.PI * 2;
                    const tx = sparkles.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.cos(angle) * SPARKLE_DISTANCE],
                    });
                    const ty = sparkles.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.sin(angle) * SPARKLE_DISTANCE],
                    });
                    const sparkleOpacity = sparkles.interpolate({
                      inputRange: [0, 0.15, 0.85, 1],
                      outputRange: [0, 1, 1, 0],
                    });
                    const sparkleScale = sparkles.interpolate({
                      inputRange: [0, 0.4, 1],
                      outputRange: [0.3, 1.1, 0.4],
                    });
                    return (
                      <Animated.View
                        key={i}
                        pointerEvents="none"
                        style={[
                          styles.sparkle,
                          {
                            opacity: sparkleOpacity,
                            transform: [{ translateX: tx }, { translateY: ty }, { scale: sparkleScale }],
                          },
                        ]}
                      />
                    );
                  })}

                  <Animated.View style={[styles.boxBody, { opacity: bodyOpacity }]}>
                    <LinearGradient
                      colors={[colors.mint, colors.mintStrong]}
                      end={{ x: 1, y: 1 }}
                      start={{ x: 0, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.bodyRibbonV} />
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.lid,
                      {
                        opacity: lidOpacity,
                        transform: [{ translateY: lidTranslateY }, { rotateZ: lidRotateDeg }],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={[colors.green, colors.mintStrong]}
                      end={{ x: 1, y: 1 }}
                      start={{ x: 0, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.lidRibbonV} />
                    <View style={styles.bowKnotShadow} />
                    <View style={styles.bowKnot} />
                    <View style={[styles.bowLoop, styles.bowLoopLeft]} />
                    <View style={[styles.bowLoop, styles.bowLoopRight]} />
                  </Animated.View>
                </Animated.View>
              </Pressable>
              {phase === 'closed' ? (
                <Text style={styles.tapHint}>Tap the gift to unwrap today&apos;s lesson</Text>
              ) : (
                <View style={styles.tapHintSpacer} />
              )}
            </View>
          ) : (
            <Animated.View
              style={[
                styles.revealWrap,
                { opacity: cardOpacity, transform: [{ scale: cardScale }, { translateY: cardY }] },
              ]}
            >
              <LessonCard lesson={lesson} />
              <View style={styles.actionsRow}>
                <Pressable accessibilityRole="button" onPress={handleClose} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, styles.closeFullWidth]}>
                  <Text style={styles.primaryButtonText}>Close</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function LessonCard({ lesson }: { lesson: FinanceLesson }) {
  const palette = RANK_PALETTE[lesson.rank];
  return (
    <ScrollView contentContainerStyle={styles.lessonContent} showsVerticalScrollIndicator={false} style={styles.lessonScroll}>
      <View style={styles.thumbnailWrap}>
        <Image source={{ uri: lesson.thumbnail }} style={styles.thumbnail} />
        <View style={[styles.rankBadge, { backgroundColor: palette.bg }]}>
          <Text style={[styles.rankBadgeText, { color: palette.text }]}>{lesson.rank}</Text>
        </View>
      </View>
      <Text style={styles.lessonTitle}>{lesson.title}</Text>
      <Section label="Lesson" body={lesson.lesson} />
      <Section label="Why it matters" body={lesson.whyItMatters} />
      <Section label="Quick tip" body={lesson.quickTip} accent />
      <Section label="Source" body={lesson.sourceInsight} muted />
    </ScrollView>
  );
}

function Section({ label, body, accent, muted }: { label: string; body: string; accent?: boolean; muted?: boolean }) {
  return (
    <View style={[styles.section, accent && styles.sectionAccent]}>
      <Text style={[styles.sectionLabel, accent && styles.sectionLabelAccent]}>{label}</Text>
      <Text style={[styles.sectionBody, muted && styles.sectionBodyMuted]}>{body}</Text>
    </View>
  );
}

const BOX_BODY_WIDTH = 168;
const BOX_BODY_HEIGHT = 110;
const LID_WIDTH = 188;
const LID_HEIGHT = 50;

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(18, 18, 18, 0.42)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modal: {
    ...shadow,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    maxHeight: '92%',
    maxWidth: 440,
    padding: spacing.lg,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerTitleWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
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
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  stagePress: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxAnchor: {
    alignItems: 'center',
    height: BOX_BODY_HEIGHT + LID_HEIGHT + 12,
    justifyContent: 'flex-end',
    width: LID_WIDTH + 24,
  },
  boxBody: {
    backgroundColor: colors.mint,
    borderRadius: 14,
    height: BOX_BODY_HEIGHT,
    overflow: 'hidden',
    width: BOX_BODY_WIDTH,
  },
  bodyRibbonV: {
    backgroundColor: colors.coral,
    bottom: 0,
    left: BOX_BODY_WIDTH / 2 - 8,
    position: 'absolute',
    top: 0,
    width: 16,
  },
  lid: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 12,
    bottom: BOX_BODY_HEIGHT - 6,
    height: LID_HEIGHT,
    justifyContent: 'center',
    overflow: 'visible',
    position: 'absolute',
    width: LID_WIDTH,
  },
  lidRibbonV: {
    backgroundColor: colors.coral,
    bottom: 0,
    left: LID_WIDTH / 2 - 8,
    position: 'absolute',
    top: 0,
    width: 16,
  },
  bowKnot: {
    backgroundColor: colors.coral,
    borderRadius: 8,
    height: 22,
    position: 'absolute',
    top: -10,
    width: 22,
    zIndex: 3,
  },
  bowKnotShadow: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 8,
    height: 22,
    position: 'absolute',
    top: -8,
    width: 22,
    zIndex: 1,
  },
  bowLoop: {
    backgroundColor: colors.coral,
    borderRadius: 10,
    height: 22,
    position: 'absolute',
    top: -18,
    width: 26,
    zIndex: 2,
  },
  bowLoopLeft: {
    left: LID_WIDTH / 2 - 28,
    transform: [{ rotateZ: '-22deg' }],
  },
  bowLoopRight: {
    right: LID_WIDTH / 2 - 28,
    transform: [{ rotateZ: '22deg' }],
  },
  sparkle: {
    backgroundColor: colors.green,
    borderRadius: 999,
    height: 10,
    left: '50%',
    marginLeft: -5,
    marginTop: -5,
    position: 'absolute',
    top: '50%',
    width: 10,
  },
  tapHint: {
    color: colors.textSoft,
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  tapHintSpacer: {
    height: 13 + spacing.lg,
  },
  bootstrapping: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
    paddingVertical: spacing.xl,
  },
  revealWrap: {
    gap: spacing.md,
  },
  lessonScroll: {
    maxHeight: 460,
  },
  lessonContent: {
    gap: spacing.md,
  },
  thumbnailWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.surfaceAlt,
    width: '100%',
  },
  rankBadge: {
    alignItems: 'center',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    left: spacing.sm,
    minWidth: 36,
    paddingHorizontal: spacing.sm,
    position: 'absolute',
    top: spacing.sm,
  },
  rankBadgeText: {
    fontFamily: fonts.heading,
    fontSize: 16,
  },
  lessonTitle: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 19,
    lineHeight: 25,
  },
  section: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 4,
    paddingTop: spacing.sm,
  },
  sectionAccent: {
    backgroundColor: '#F0FFF7',
    borderRadius: radius.md,
    borderTopWidth: 0,
    padding: spacing.md,
  },
  sectionLabel: {
    color: colors.textSoft,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sectionLabelAccent: {
    color: colors.green,
  },
  sectionBody: {
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionBodyMuted: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 19,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButtonText: {
    color: colors.surface,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: {
    color: colors.text,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.8,
  },
  cooldownGiftWrap: {
    opacity: 0.55,
  },
  cooldownTitle: {
    color: colors.textSoft,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  countdownBig: {
    color: colors.green,
    fontFamily: fonts.heading,
    fontSize: 26,
    marginTop: spacing.sm,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  closeFullWidth: {
    width: '100%',
  },
});

function formatCooldownLabel(ms: number): string {
  const totalSeconds = Math.max(1, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
}

function GiftBoxClosedStill() {
  return (
    <View style={styles.boxAnchor}>
      <View style={styles.boxBody}>
        <LinearGradient
          colors={[colors.mint, colors.mintStrong]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.bodyRibbonV} />
      </View>
      <View style={styles.lid}>
        <LinearGradient
          colors={[colors.green, colors.mintStrong]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.lidRibbonV} />
        <View style={styles.bowKnotShadow} />
        <View style={styles.bowKnot} />
        <View style={[styles.bowLoop, styles.bowLoopLeft]} />
        <View style={[styles.bowLoop, styles.bowLoopRight]} />
      </View>
    </View>
  );
}
