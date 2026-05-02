import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Logo } from '../components/Logo';
import { ServerUnavailable } from '../components/ServerUnavailable';
import type { SkimpDataAdapter, WeeklyRecap } from '../data/types';
import { colors, fonts, shadow, spacing } from '../theme';

const months = [
  { label: 'Jan', fullLabel: 'January 2026', year: '2026', weekRanges: ['Jan 4 - Jan 10', 'Jan 11 - Jan 17', 'Jan 18 - Jan 24', 'Jan 25 - Jan 31'] },
  { label: 'Feb', fullLabel: 'February 2026', year: '2026', weekRanges: ['Feb 1 - Feb 7', 'Feb 8 - Feb 14', 'Feb 15 - Feb 21', 'Feb 22 - Feb 28'] },
  { label: 'Mar', fullLabel: 'March 2026', year: '2026', weekRanges: ['Mar 1 - Mar 7', 'Mar 8 - Mar 14', 'Mar 15 - Mar 21', 'Mar 22 - Mar 28'] },
  { label: 'Apr', fullLabel: 'April 2026', year: '2026', weekRanges: ['Apr 5 - Apr 11', 'Apr 12 - Apr 18', 'Apr 19 - Apr 25', 'Apr 26 - May 2'] },
  { label: 'May', fullLabel: 'May 2026', year: '2026', weekRanges: ['May 3 - May 9', 'May 10 - May 16', 'May 17 - May 23', 'May 24 - May 30'] },
];

const monthItemWidth = 116;
const monthGap = 12;
const monthSnap = monthItemWidth + monthGap;

type MemoriesScreenProps = {
  adapter: SkimpDataAdapter;
  groupId: string;
  currentUserId: string;
  onBack: () => void;
  onResetSession?: () => void;
};

export function MemoriesScreen({ adapter, groupId, onBack, onResetSession }: MemoriesScreenProps) {
  const [recaps, setRecaps] = useState<WeeklyRecap[]>();
  const [serverError, setServerError] = useState<unknown>();
  const [activeMonth, setActiveMonth] = useState(months.length - 1);
  const { width } = useWindowDimensions();
  const monthScrollX = useRef(new Animated.Value((months.length - 1) * monthSnap)).current;
  const monthScrollRef = useRef<ScrollView>(null);
  const contentAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    adapter.getWeeklyRecaps(groupId)
      .then((nextRecaps) => {
        setRecaps(nextRecaps);
        setServerError(undefined);
      })
      .catch((error) => setServerError(error));
  }, [adapter, groupId]);

  useEffect(() => {
    requestAnimationFrame(() => {
      monthScrollRef.current?.scrollTo({ x: activeMonth * monthSnap, animated: false });
    });
  }, []);

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
    return <ServerUnavailable error={serverError} onResetSession={onResetSession} />;
  }

  if (!recaps) {
    return <Loading />;
  }

  const activeMonthData = months[activeMonth];

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
                  monthScrollRef.current?.scrollTo({ x: index * monthSnap, animated: true });
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
          {activeMonthData.weekRanges.map((range, index) => (
            <Pressable accessibilityRole="button" key={`${activeMonthData.label}-${range}`} style={({ pressed }) => [styles.weekCard, pressed && styles.pressed]}>
              <View>
                <Text style={styles.weekTitle}>Week {index + 1}</Text>
                <Text style={styles.weekRange}>{range}</Text>
              </View>
              <View style={styles.weekFooter}>
                <Text style={styles.challengeTitle}>Weekly Challenge</Text>
                <View style={styles.arrowCircle}>
                  <ArrowRight color={colors.text} size={22} strokeWidth={2.4} />
                </View>
              </View>
            </Pressable>
          ))}
        </Animated.View>
      </ScrollView>
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
  weekCard: {
    ...shadow,
    backgroundColor: colors.surface,
    borderRadius: 16,
    gap: spacing.xl,
    padding: spacing.lg,
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
  weekFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  challengeTitle: {
    color: colors.text,
    fontFamily: fonts.headingSemi,
    fontSize: 19,
  },
  arrowCircle: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
});
