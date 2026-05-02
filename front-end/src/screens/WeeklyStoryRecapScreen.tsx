import { X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import type { WeeklyStoryMock } from '../data/weeklyStoryMockData';
import { fonts, spacing } from '../theme';

const SLIDE_COUNT = 12;

const story = {
  bg: '#09090B',
  text: '#FAFAFA',
  muted: 'rgba(250,250,250,0.55)',
  subtle: 'rgba(250,250,250,0.28)',
  accent: '#34C889',
  accentSoft: 'rgba(52, 200, 137, 0.25)',
} as const;

function money(n: number, currency: string) {
  const sym = currency === 'NZD' ? '$' : '$';
  return `${sym}${n.toLocaleString('en-NZ', { minimumFractionDigits: n % 1 ? 1 : 0, maximumFractionDigits: 1 })}`;
}

type Props = {
  visible: boolean;
  onClose: () => void;
  data?: WeeklyStoryMock;
  /** When set (e.g. from Memories), intro slide shows this week’s labels instead of mock defaults. */
  weekContext?: { weekLabel: string; weekYear: string } | null;
};

export function WeeklyStoryRecapScreen({ visible, onClose, data, weekContext }: Props) {
  const payload = useMemo(() => {
    if (!data) return null;
    if (!weekContext) return data;
    return { ...data, weekLabel: weekContext.weekLabel, weekYear: weekContext.weekYear };
  }, [data, weekContext]);
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const slideX = useRef(new Animated.Value(0)).current;

  const tapZoneTop =
    headerHeight > 0
      ? headerHeight
      : Platform.OS === 'ios'
        ? 54 + 56
        : spacing.xl + 4 + 56;

  useEffect(() => {
    if (visible) {
      setIndex(0);
      slideX.setValue(0);
    }
  }, [visible, slideX]);

  const animateIn = useCallback(() => {
    fade.setValue(0);
    slideX.setValue(12);
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideX, {
        toValue: 0,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slideX]);

  useEffect(() => {
    if (!visible || !payload) return;
    animateIn();
  }, [index, visible, payload, animateIn]);

  const goNext = useCallback(() => {
    if (index >= SLIDE_COUNT - 1) {
      onClose();
      return;
    }
    setIndex((i) => i + 1);
  }, [index, onClose]);

  const goPrev = useCallback(() => {
    if (index <= 0) return;
    setIndex((i) => i - 1);
  }, [index]);

  if (!payload) return null;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent
      visible={visible}
    >
      <StatusBar style="light" />
      <View style={[styles.root, { width, minHeight: height }]}>
        <View
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
          style={[
            styles.headerChrome,
            { paddingTop: Platform.OS === 'ios' ? 54 : spacing.xl + 4 },
          ]}
        >
          <View style={styles.closeRow}>
            <Pressable
              accessibilityLabel="Close recap"
              accessibilityRole="button"
              hitSlop={14}
              onPress={onClose}
              style={styles.closeBtn}
            >
              <X color={story.text} size={26} strokeWidth={2} />
            </Pressable>
          </View>
          <View style={styles.progressRow}>
            {Array.from({ length: SLIDE_COUNT }, (_, i) => (
              <View
                key={i}
                style={[styles.progressSeg, i <= index ? styles.progressSegOn : styles.progressSegOff]}
              />
            ))}
          </View>
        </View>

        <View style={styles.slideHost}>
          <Animated.View
            style={[
              styles.slideAnim,
              {
                opacity: fade,
                transform: [{ translateX: slideX }],
              },
            ]}
          >
            {renderSlide(index, payload, width)}
          </Animated.View>
        </View>

        <View style={[styles.tapZones, { top: tapZoneTop }]} pointerEvents="box-none">
          <Pressable accessibilityRole="button" onPress={goPrev} style={styles.tapLeft} />
          <Pressable accessibilityRole="button" onPress={goNext} style={styles.tapRight} />
        </View>

        <Text style={styles.hint}>{index < SLIDE_COUNT - 1 ? 'Tap right to continue · left to go back' : 'Tap right to finish'}</Text>
      </View>
    </Modal>
  );
}

function renderSlide(i: number, d: WeeklyStoryMock, width: number) {
  const maxW = Math.min(width - spacing.xl * 2, 340);

  switch (i) {
    case 0:
      return (
        <View style={styles.centerBlock}>
          <Text style={styles.kicker}>Weekly recap</Text>
          <Text style={styles.hero}>{d.weekLabel}</Text>
          <Text style={styles.year}>{d.weekYear}</Text>
          <Text style={styles.body}>Here’s how you saved, spent, and stacked up with friends.</Text>
        </View>
      );
    case 1: {
      const pct = Math.min(100, Math.round((d.savedAmount / d.goalAmount) * 100));
      return (
        <View style={styles.centerBlock}>
          <Text style={styles.kicker}>Savings goal</Text>
          <Text style={styles.statBig}>{money(d.savedAmount, d.currency)}</Text>
          <Text style={styles.body}>
            saved of {money(d.goalAmount, d.currency)} goal
          </Text>
          <View style={[styles.goalBar, { width: maxW }]}>
            <View style={[styles.goalBarInner, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.pctLabel}>{pct}% there</Text>
        </View>
      );
    }
    case 2: {
      const delta = d.spentLastWeek - d.spentTotal;
      const down = delta > 0;
      const pctChange =
        d.spentLastWeek > 0 ? Math.round((Math.abs(delta) / d.spentLastWeek) * 100) : 0;
      return (
        <View style={styles.centerBlock}>
          <Text style={styles.kicker}>Weekly spending</Text>
          <Text style={styles.statBig}>{money(d.spentTotal, d.currency)}</Text>
          <Text style={styles.body}>total out the door</Text>
          <View style={[styles.comparePill, { borderColor: down ? story.accent : story.subtle }]}>
            <Text style={[styles.compareText, { color: down ? story.accent : story.text }]}>
              {down ? '↓' : '↑'} {pctChange}% vs last week
            </Text>
          </View>
          <Text style={styles.finePrint}>
            {down ? 'Nice — you spent less than the week before.' : 'A bit more than last week — still yours to steer.'}
          </Text>
        </View>
      );
    }
    case 3:
      return (
        <View style={styles.centerBlock}>
          <Text style={styles.kicker}>Top category</Text>
          <Text style={styles.hero}>{d.topCategory.name}</Text>
          <Text style={styles.statMid}>{d.topCategory.percentOfSpend}%</Text>
          <Text style={styles.body}>of your week</Text>
          <Text style={styles.finePrint}>{money(d.topCategory.amount, d.currency)} in this bucket</Text>
        </View>
      );
    case 4:
      return (
        <View style={styles.centerBlock}>
          <Text style={styles.emoji}>{d.identity.emoji}</Text>
          <Text style={styles.kicker}>This week you were a…</Text>
          <Text style={styles.hero}>{d.identity.title}</Text>
          <Text style={styles.bodyCenter}>{d.identity.tagline}</Text>
        </View>
      );
    case 5: {
      const top = d.leaderboard.friends.slice(0, 3);
      return (
        <View style={styles.centerBlock}>
          <Text style={styles.kicker}>Squad hall of shame</Text>
          <Text style={styles.bodyCenter}>
            Highest unnecessary spend takes the crown — #1 gets roasted first.
          </Text>
          <View style={styles.leaderList}>
            {top.map((row) => (
              <View
                key={row.rank}
                style={[
                  styles.leaderRow,
                  row.isYou && styles.leaderRowYou,
                  row.rank === 1 && styles.leaderRowTopSpender,
                ]}
              >
                <Text style={styles.leaderRank}>{row.rank}</Text>
                <Text style={[styles.leaderName, row.isYou && styles.leaderNameYou]}>
                  {row.displayName}
                  {row.isYou ? '  ·  you' : ''}
                </Text>
                <Text style={styles.leaderScore}>{money(row.weeklyScore, d.currency)}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.finePrint}>
            You’re #{d.leaderboard.yourRank} for unnecessary spend — tread lighter or we’re doing this again next week.
          </Text>
        </View>
      );
    }
    case 6: {
      const { friendName, youPercentBetter, aheadOfFriend, metricLabel } = d.friendComparison;
      return (
        <View style={styles.centerBlock}>
          <Text style={styles.kicker}>Head-to-head</Text>
          <Text style={styles.hero}>{aheadOfFriend ? 'Ahead' : 'Behind'}</Text>
          <Text style={styles.bodyCenter}>
            {aheadOfFriend ? (
              <>
                You’re <Text style={styles.emph}>{youPercentBetter}%</Text> leaner than {friendName} on {metricLabel}.
              </>
            ) : (
              <>
                {friendName} edged you by <Text style={styles.emph}>{youPercentBetter}%</Text> on {metricLabel} — fuel for next week.
              </>
            )}
          </Text>
        </View>
      );
    }
    case 7:
      return (
        <View style={styles.centerBlock}>
          <Text style={styles.kicker}>Consistency</Text>
          <Text style={styles.mega}>{d.streak.weeksOnTrack}</Text>
          <Text style={styles.body}>weeks on track</Text>
          <Text style={styles.bodyCenter}>{d.streak.consistencyLabel}</Text>
          <Text style={styles.quote}>{d.streak.subtitle}</Text>
        </View>
      );
    case 8:
      return (
        <View style={styles.centerBlock}>
          <Text style={styles.kicker}>Insight</Text>
          <Text style={styles.title}>{d.insight.headline}</Text>
          <Text style={styles.bodyCenter}>{d.insight.body}</Text>
          <View style={styles.lessonBox}>
            <Text style={styles.lessonLabel}>Try this</Text>
            <Text style={styles.lessonBody}>{d.insight.recommendedLesson}</Text>
          </View>
        </View>
      );
    case 9:
      return (
        <View style={styles.centerBlock}>
          <Text style={styles.kicker}>Points</Text>
          <Text style={styles.statBig}>+{d.rewards.pointsGainedThisWeek} points</Text>
          <Text style={styles.body}>this week</Text>
          <View style={styles.levelRow}>
            <Text style={styles.levelBadge}>Lv {d.rewards.level}</Text>
            <Text style={styles.levelTitle}>{d.rewards.levelTitle}</Text>
          </View>
          <Text style={styles.finePrint}>{d.rewards.totalPoints.toLocaleString()} points lifetime</Text>
          <View style={styles.badgeRow}>
            {d.rewards.badgesEarned.map((b) => (
              <View key={b} style={styles.badgeChip}>
                <Text style={styles.badgeText}>{b}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    case 10:
      return (
        <View style={styles.centerBlock}>
          <Text style={styles.kicker}>That’s a wrap</Text>
          <Text style={styles.title}>{d.summary.headline}</Text>
          <Text style={styles.bodyCenter}>{d.summary.subtext}</Text>
        </View>
      );
    case 11:
      return (
        <View style={styles.centerBlock}>
          <Text style={styles.kicker}>Send the damage report</Text>
          <Text style={styles.hero}>Accountability, but funny</Text>
          <Text style={styles.bodyCenter}>
            Drop this recap in the squad chat — let #1 know the vibes are official and maybe lock the delivery apps.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => Alert.alert('Demo', 'Sharing would open the native share sheet here.')}
            style={styles.sharePrimary}
          >
            <Text style={styles.sharePrimaryText}>Share recap</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => Alert.alert('Demo', 'Story link copied (mock).')}
            style={styles.shareGhost}
          >
            <Text style={styles.shareGhostText}>Copy link</Text>
          </Pressable>
        </View>
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: story.bg,
    paddingBottom: spacing.xl,
  },
  headerChrome: {
    zIndex: 30,
    elevation: 12,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: story.bg,
  },
  closeRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    minHeight: 44,
    width: '100%',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.sm,
    width: '100%',
  },
  progressSeg: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  progressSegOn: {
    backgroundColor: story.text,
  },
  progressSegOff: {
    backgroundColor: story.subtle,
  },
  closeBtn: {
    padding: spacing.sm,
    marginRight: -spacing.sm,
  },
  slideHost: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  slideAnim: {
    width: '100%',
    maxWidth: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBlock: {
    width: '100%',
    maxWidth: 400,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    flex: 1,
    gap: spacing.md,
  },
  tapZones: {
    bottom: 0,
    flexDirection: 'row',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  tapLeft: {
    flex: 1,
  },
  tapRight: {
    flex: 2,
  },
  hint: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 400,
    textAlign: 'center',
    color: story.muted,
    fontFamily: fonts.body,
    fontSize: 11,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  kicker: {
    color: story.accent,
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    width: '100%',
    textAlign: 'center',
  },
  hero: {
    color: story.text,
    fontFamily: fonts.heading,
    fontSize: 40,
    textAlign: 'center',
    lineHeight: 46,
    width: '100%',
  },
  year: {
    color: story.muted,
    fontFamily: fonts.headingSemi,
    fontSize: 22,
    marginTop: -4,
    width: '100%',
    textAlign: 'center',
  },
  title: {
    color: story.text,
    fontFamily: fonts.headingSemi,
    fontSize: 26,
    textAlign: 'center',
    lineHeight: 32,
    width: '100%',
  },
  statBig: {
    color: story.text,
    fontFamily: fonts.heading,
    fontSize: 52,
    lineHeight: 56,
    textAlign: 'center',
    width: '100%',
  },
  statMid: {
    color: story.text,
    fontFamily: fonts.heading,
    fontSize: 44,
    lineHeight: 48,
    textAlign: 'center',
    width: '100%',
  },
  mega: {
    color: story.text,
    fontFamily: fonts.heading,
    fontSize: 96,
    lineHeight: 102,
    textAlign: 'center',
    width: '100%',
  },
  emoji: {
    fontSize: 56,
    marginBottom: spacing.xs,
  },
  body: {
    color: story.muted,
    fontFamily: fonts.body,
    fontSize: 17,
    textAlign: 'center',
    width: '100%',
  },
  bodyCenter: {
    color: story.muted,
    fontFamily: fonts.body,
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.sm,
    width: '100%',
  },
  finePrint: {
    color: story.subtle,
    fontFamily: fonts.body,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.xs,
    width: '100%',
  },
  pctLabel: {
    color: story.text,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    width: '100%',
    textAlign: 'center',
  },
  goalBar: {
    height: 8,
    borderRadius: 999,
    backgroundColor: story.subtle,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  goalBarInner: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: story.accent,
  },
  comparePill: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: story.accentSoft,
    alignSelf: 'center',
    maxWidth: '100%',
  },
  compareText: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    textAlign: 'center',
  },
  quote: {
    marginTop: spacing.md,
    color: story.text,
    fontFamily: fonts.headingSemi,
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    width: '100%',
  },
  emph: {
    color: story.accent,
    fontFamily: fonts.bodySemi,
  },
  leaderList: {
    width: '100%',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  leaderRowYou: {
    borderWidth: 1,
    borderColor: story.accent,
    backgroundColor: story.accentSoft,
  },
  leaderRowTopSpender: {
    borderColor: 'rgba(255, 142, 127, 0.65)',
    borderWidth: 1,
    backgroundColor: 'rgba(255, 142, 127, 0.12)',
  },
  leaderRank: {
    width: 28,
    color: story.muted,
    fontFamily: fonts.headingSemi,
    fontSize: 18,
  },
  leaderName: {
    flex: 1,
    color: story.text,
    fontFamily: fonts.bodySemi,
    fontSize: 16,
  },
  leaderNameYou: {
    color: story.accent,
  },
  leaderScore: {
    color: story.text,
    fontFamily: fonts.headingSemi,
    fontSize: 17,
  },
  lessonBox: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    width: '100%',
  },
  lessonLabel: {
    color: story.accent,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lessonBody: {
    color: story.text,
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    lineHeight: 22,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  levelBadge: {
    color: story.bg,
    backgroundColor: story.accent,
    fontFamily: fonts.headingSemi,
    fontSize: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    overflow: 'hidden',
  },
  levelTitle: {
    color: story.text,
    fontFamily: fonts.headingSemi,
    fontSize: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  badgeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: story.subtle,
  },
  badgeText: {
    color: story.text,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  sharePrimary: {
    marginTop: spacing.xxl,
    backgroundColor: story.accent,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: 999,
    width: '100%',
    alignItems: 'center',
  },
  sharePrimaryText: {
    color: story.bg,
    fontFamily: fonts.headingSemi,
    fontSize: 17,
  },
  shareGhost: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  shareGhostText: {
    color: story.text,
    fontFamily: fonts.bodySemi,
    fontSize: 16,
  },
});
