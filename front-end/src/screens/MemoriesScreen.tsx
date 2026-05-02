import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Logo } from '../components/Logo';
import { ServerUnavailable } from '../components/ServerUnavailable';
import { weeklyStoryMock } from '../data/weeklyStoryMockData';
import type { SkimpDataAdapter, WeeklyRecap } from '../data/types';
import { getDemoChallengeForMemoriesWeek } from '../data/mockDemoWeeklyChallenges';
import { MEMORIES_MONTHS, memoriesWeekFlatIndex, type MonthWeek } from '../data/memoriesCalendar';
import { buildRecapByWeekKey, getRecapForCalendarWeek, getViewerWeekOutcome } from '../data/memoriesWeekOutcome';
import { WeeklyStoryRecapScreen } from './WeeklyStoryRecapScreen';
import { colors, fonts, shadow, spacing } from '../theme';

const months = MEMORIES_MONTHS;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isDateInWeek(now: Date, week: MonthWeek): boolean {
  const day = startOfDay(now).getTime();
  return day >= startOfDay(week.start).getTime() && day <= startOfDay(week.end).getTime();
}

/** Which week contains "today" in our demo grid, if any. */
function getCurrentWeekPointer(now: Date = new Date()): { monthIndex: number; weekIndex: number } | null {
  for (let mi = 0; mi < months.length; mi++) {
    const wks = months[mi].weeks;
    for (let wi = 0; wi < wks.length; wi++) {
      if (isDateInWeek(now, wks[wi])) return { monthIndex: mi, weekIndex: wi };
    }
  }
  return null;
}

/** Past = week fully ended before today; current = today in range; future = week not started. */
function getWeekTimelineRelation(week: MonthWeek, now: Date = new Date()): 'past' | 'current' | 'future' {
  const day = startOfDay(now).getTime();
  const start = startOfDay(week.start).getTime();
  const end = startOfDay(week.end).getTime();
  if (end < day) return 'past';
  if (start <= day && day <= end) return 'current';
  return 'future';
}

const monthItemWidth = 116;
const monthGap = 12;
const monthSnap = monthItemWidth + monthGap;

type MemoriesScreenProps = {
  adapter: SkimpDataAdapter;
  groupId: string;
  currentUserId: string;
  onBack: () => void;
};

export function MemoriesScreen({ adapter, groupId, currentUserId, onBack }: MemoriesScreenProps) {
  const defaultMonthIndex = useMemo(
    () => getCurrentWeekPointer()?.monthIndex ?? months.length - 1,
    [],
  );
  const [recaps, setRecaps] = useState<WeeklyRecap[]>();
  const [serverError, setServerError] = useState(false);
  const [activeMonth, setActiveMonth] = useState(defaultMonthIndex);
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyContext, setStoryContext] = useState<{ weekLabel: string; weekYear: string } | null>(null);
  const { width } = useWindowDimensions();
  const monthScrollX = useRef(new Animated.Value(defaultMonthIndex * monthSnap)).current;
  const monthScrollRef = useRef<ScrollView>(null);
  const contentAnim = useRef(new Animated.Value(1)).current;
  const recapByWeekKey = useMemo(() => buildRecapByWeekKey(recaps ?? []), [recaps]);

  useEffect(() => {
    adapter.getWeeklyRecaps(groupId)
      .then((nextRecaps) => {
        setRecaps(nextRecaps);
        setServerError(false);
      })
      .catch(() => setServerError(true));
  }, [adapter, groupId]);

  /** Sync horizontal offset whenever the selected month or layout can change (carousel exists only after recaps load). */
  useEffect(() => {
    if (!recaps) return;

    const x = activeMonth * monthSnap;
    const scrollIntoView = () => {
      monthScrollRef.current?.scrollTo({ x, animated: false });
      monthScrollX.setValue(x);
    };

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(scrollIntoView);
    });
    return () => cancelAnimationFrame(id);
  }, [recaps, width, activeMonth]);

  useEffect(() => {
    contentAnim.setValue(0);
    Animated.spring(contentAnim, {
      toValue: 1,
      damping: 15,
      mass: 0.55,
      stiffness: 180,
      useNativeDriver: true,
    }).start();
  }, [activeMonth, contentAnim]);

  if (serverError) {
    return <ServerUnavailable />;
  }

  if (!recaps) {
    return <Loading />;
  }

  const activeMonthData = months[activeMonth];
  const currentWeekPointer = getCurrentWeekPointer();

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <ArrowLeft color={colors.text} size={24} strokeWidth={2.4} />
        </Pressable>
        <Logo width={92} height={38} />
        <View style={styles.backButton} />
      </View>
      <View style={styles.blueRule} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.ScrollView
          ref={monthScrollRef as never}
          decelerationRate="fast"
          horizontal
          onMomentumScrollEnd={(event) => {
            const nextIndex = Math.round(event.nativeEvent.contentOffset.x / monthSnap);
            setActiveMonth(Math.max(0, Math.min(months.length - 1, nextIndex)));
          }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: monthScrollX } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          snapToInterval={monthSnap}
          style={styles.monthCarousel}
          contentContainerStyle={[styles.monthCarouselContent, { paddingHorizontal: Math.max(0, (width - monthItemWidth) / 2) }]}
        >
          {months.map((month, index) => {
            const inputRange = [(index - 1) * monthSnap, index * monthSnap, (index + 1) * monthSnap];
            const scale = monthScrollX.interpolate({ inputRange, outputRange: [0.82, 1, 0.82], extrapolate: 'clamp' });
            const opacity = monthScrollX.interpolate({ inputRange, outputRange: [0.55, 1, 0.55], extrapolate: 'clamp' });
            const translateY = monthScrollX.interpolate({ inputRange, outputRange: [10, 0, 10], extrapolate: 'clamp' });
            const active = index === activeMonth;
            return (
              <Pressable
                accessibilityRole="button"
                key={month.fullLabel}
                onPress={() => {
                  setActiveMonth(index);
                }}
              >
                <Animated.View style={[styles.monthCard, active && styles.activeMonthCard, { opacity, transform: [{ scale }, { translateY }] }]}>
                  <Text style={[styles.monthText, active && styles.activeMonthText]}>{month.label}</Text>
                  <Text style={[styles.yearText, active && styles.activeMonthText]}>{month.year}</Text>
                  {active ? <View style={styles.monthFocusDot} /> : null}
                </Animated.View>
              </Pressable>
            );
          })}
        </Animated.ScrollView>

        <Animated.View
          style={[
            styles.monthTitleWrap,
            {
              opacity: contentAnim,
              transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
            },
          ]}
        >
          <Text style={styles.monthTitle}>{activeMonthData.fullLabel}</Text>
          <Text style={styles.monthSubtitle}>Swipe the months to browse old weekly challenges</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.weekList,
            {
              opacity: contentAnim,
              transform: [{ translateX: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
            },
          ]}
        >
          {activeMonthData.weeks.map((week, index) => {
            const demo = getDemoChallengeForMemoriesWeek(activeMonth, index);
            const isThisWeek =
              currentWeekPointer !== null &&
              currentWeekPointer.monthIndex === activeMonth &&
              currentWeekPointer.weekIndex === index;
            const weekRelation = getWeekTimelineRelation(week);
            const recapAvailable = weekRelation === 'past';
            const flatWeekIndex = memoriesWeekFlatIndex(activeMonth, index);
            const recapForWeek = getRecapForCalendarWeek(recapByWeekKey, week);
            const weekOutcome = getViewerWeekOutcome({
              weekRelation,
              currentUserId,
              recapForWeek,
              flatWeekIndex,
            });
            const outcomeA11y =
              weekOutcome === 'pass' ? ', passed' : weekOutcome === 'fail' ? ', did not pass' : '';
            return (
              <Pressable
                accessibilityHint={
                  recapAvailable ? 'Opens recap for this week' : 'Recap is only available after this week ends'
                }
                accessibilityLabel={
                  isThisWeek
                    ? `${demo.title}, ${week.rangeLabel}, current week`
                    : `${demo.title}, ${week.rangeLabel}${outcomeA11y}`
                }
                accessibilityRole="button"
                accessibilityState={{ disabled: !recapAvailable }}
                disabled={!recapAvailable}
                key={`${activeMonthData.label}-${week.rangeLabel}`}
                onPress={() => {
                  if (!recapAvailable) return;
                  setStoryContext({ weekLabel: week.rangeLabel, weekYear: activeMonthData.year });
                  setStoryOpen(true);
                }}
                style={({ pressed }) => [
                  styles.weekCard,
                  isThisWeek && styles.weekCardCurrent,
                  weekRelation === 'future' && styles.weekCardFuture,
                  weekOutcome === 'pass' && styles.weekCardPastPass,
                  weekOutcome === 'fail' && styles.weekCardPastFail,
                  pressed && recapAvailable && styles.pressed,
                ]}
              >
                <View style={styles.weekCardHeader}>
                  <View style={styles.weekCardHeaderText}>
                    <View style={styles.weekTitleRow}>
                      <Text
                        style={[styles.weekTitle, weekOutcome === 'fail' && styles.challengeTextCrossedOut]}
                      >
                        Week {index + 1}
                      </Text>
                      {weekOutcome === 'pass' ? (
                        <Check
                          accessibilityElementsHidden
                          importantForAccessibility="no"
                          color={colors.green}
                          size={20}
                          strokeWidth={2.5}
                          style={styles.weekOutcomeIcon}
                        />
                      ) : weekOutcome === 'fail' ? (
                        <X
                          accessibilityElementsHidden
                          importantForAccessibility="no"
                          color={colors.coral}
                          size={20}
                          strokeWidth={3.2}
                          style={styles.weekOutcomeIcon}
                        />
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.weekRange,
                        isThisWeek && styles.weekRangeCurrent,
                        weekOutcome === 'fail' && styles.challengeTextCrossedOut,
                      ]}
                    >
                      {week.rangeLabel}
                    </Text>
                    {!recapAvailable ? (
                      <Text style={styles.weekRecapHint}>
                        {weekRelation === 'current'
                          ? 'Recap unlocks when this week ends'
                          : 'Upcoming week'}
                      </Text>
                    ) : null}
                  </View>
                  {isThisWeek ? (
                    <View style={styles.thisWeekBadge}>
                      <Text style={styles.thisWeekBadgeText}>This week</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.weekFooter}>
                  <View style={styles.challengeBlock}>
                    <Text
                      style={[
                        styles.demoChallengeTitle,
                        weekOutcome === 'fail' && styles.challengeTextCrossedOut,
                      ]}
                    >
                      {demo.title}
                    </Text>
                    <Text
                      style={[
                        styles.demoChallengeDescription,
                        weekOutcome === 'fail' && styles.challengeTextCrossedOut,
                      ]}
                      numberOfLines={3}
                    >
                      {demo.description}
                    </Text>
                    <View style={styles.demoChallengeMeta}>
                      <Text style={styles.demoChallengeCategory}>{demo.category}</Text>
                      <Text style={styles.demoChallengeMetaSep}>·</Text>
                      <Text style={styles.demoChallengeDifficulty}>Lvl {demo.difficulty}</Text>
                      <Text style={styles.demoChallengeMetaSep}>·</Text>
                      <Text style={styles.demoChallengeXp}>+{demo.xp} XP</Text>
                      {recapAvailable ? (
                        <>
                          <Text style={styles.demoChallengeMetaSep}>·</Text>
                          <Text style={styles.demoRecapCta}>Tap for recap</Text>
                        </>
                      ) : null}
                    </View>
                  </View>
                  <View
                    style={[
                      styles.arrowCircle,
                      styles.weekFooterArrow,
                      isThisWeek && styles.arrowCircleCurrent,
                      !recapAvailable && styles.arrowCircleMuted,
                    ]}
                  >
                    <ArrowRight color={recapAvailable ? colors.text : colors.muted} size={22} strokeWidth={2.4} />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </Animated.View>
      </ScrollView>
      <WeeklyStoryRecapScreen
        data={weeklyStoryMock}
        onClose={() => {
          setStoryOpen(false);
          setStoryContext(null);
        }}
        visible={storyOpen}
        weekContext={storyContext}
      />
    </View>
  );
}

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.green} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    height: 56,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  blueRule: {
    backgroundColor: colors.blueStrong,
    height: 4,
  },
  content: {
    paddingBottom: spacing.xxl,
    paddingTop: spacing.lg,
  },
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  monthCarousel: {
    marginBottom: spacing.md,
  },
  monthCarouselContent: {
    gap: monthGap,
    paddingVertical: spacing.md,
  },
  monthCard: {
    ...shadow,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    height: 88,
    justifyContent: 'center',
    width: monthItemWidth,
  },
  activeMonthCard: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  monthText: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 22,
    textTransform: 'uppercase',
  },
  yearText: {
    color: colors.textSoft,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    marginTop: -2,
  },
  activeMonthText: {
    color: colors.text,
  },
  monthFocusDot: {
    backgroundColor: colors.green,
    borderRadius: 999,
    bottom: 10,
    height: 6,
    position: 'absolute',
    width: 24,
  },
  monthTitleWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  monthTitle: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 25,
  },
  monthSubtitle: {
    color: colors.textSoft,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    marginTop: 3,
    textAlign: 'center',
  },
  weekList: {
    gap: spacing.screenGap,
    paddingHorizontal: spacing.lg,
  },
  weekCardHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  weekCardHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  weekTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  weekOutcomeIcon: {
    opacity: 0.92,
  },
  challengeTextCrossedOut: {
    opacity: 0.82,
    textDecorationColor: colors.coral,
    textDecorationLine: 'line-through',
  },
  weekCard: {
    ...shadow,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: spacing.xl,
    padding: spacing.lg,
  },
  weekCardCurrent: {
    backgroundColor: colors.mint,
    borderColor: colors.green,
  },
  weekCardFuture: {
    opacity: 0.78,
    backgroundColor: colors.surfaceAlt,
  },
  weekCardPastPass: {
    borderLeftColor: 'rgba(15, 138, 80, 0.42)',
    borderLeftWidth: 4,
  },
  weekCardPastFail: {
    borderLeftColor: 'rgba(255, 158, 158, 0.88)',
    borderLeftWidth: 4,
  },
  thisWeekBadge: {
    backgroundColor: colors.green,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  thisWeekBadgeText: {
    color: colors.surface,
    fontFamily: fonts.bodySemi,
    fontSize: 11,
  },
  pressed: {
    opacity: 0.72,
  },
  weekTitle: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 20,
  },
  weekRange: {
    color: colors.textSoft,
    fontFamily: fonts.body,
    fontSize: 13,
    marginTop: 6,
  },
  weekRangeCurrent: {
    color: colors.text,
    fontFamily: fonts.bodySemi,
  },
  weekRecapHint: {
    color: colors.textSoft,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: spacing.sm,
    lineHeight: 16,
  },
  weekFooter: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  challengeBlock: {
    flex: 1,
    minWidth: 0,
  },
  demoChallengeTitle: {
    color: colors.text,
    fontFamily: fonts.headingSemi,
    fontSize: 18,
    lineHeight: 24,
  },
  demoChallengeDescription: {
    color: colors.textSoft,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  demoChallengeMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.md,
  },
  demoChallengeCategory: {
    color: colors.green,
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    textTransform: 'capitalize',
  },
  demoChallengeMetaSep: {
    color: colors.textSoft,
    fontFamily: fonts.body,
    fontSize: 11,
  },
  demoChallengeDifficulty: {
    color: colors.textSoft,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
  },
  demoChallengeXp: {
    color: colors.text,
    fontFamily: fonts.bodySemi,
    fontSize: 11,
  },
  demoRecapCta: {
    color: colors.blueStrong,
    fontFamily: fonts.bodySemi,
    fontSize: 11,
  },
  weekFooterArrow: {
    alignSelf: 'center',
  },
  arrowCircle: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  arrowCircleCurrent: {
    backgroundColor: colors.surface,
  },
  arrowCircleMuted: {
    opacity: 0.45,
    backgroundColor: colors.surfaceAlt,
  },
});
