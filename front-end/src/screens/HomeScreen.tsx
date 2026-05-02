import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ActivityFeedItem } from '../components/ActivityFeedItem';
import { AppHeader } from '../components/AppHeader';
import { Card } from '../components/Card';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { ServerUnavailable } from '../components/ServerUnavailable';
import { SpendingGraphCard } from '../components/SpendingGraphCard';
import { getWeeklyChallengeHomeDisplay } from '../data/weeklyChallengeDisplay';
import type { HomeDashboard, SkimpDataAdapter } from '../data/types';
import { colors, fonts, spacing } from '../theme';

type HomeScreenProps = {
  adapter: SkimpDataAdapter;
  currentUserId: string;
};

export function HomeScreen({ adapter, currentUserId }: HomeScreenProps) {
  const [dashboard, setDashboard] = useState<HomeDashboard>();
  const [serverError, setServerError] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [carouselScrollEnabled, setCarouselScrollEnabled] = useState(true);
  const carouselScrollX = useRef(new Animated.Value(0)).current;
  const carouselRef = useRef<ScrollView | null>(null);
  const { width } = useWindowDimensions();

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      adapter.getHomeDashboard(currentUserId)
        .then((nextDashboard) => {
          if (!cancelled) {
            setDashboard(nextDashboard);
            setServerError(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setServerError(true);
          }
        });
    };

    load();
    const poll = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [adapter, currentUserId]);

  const simulateTransaction = async () => {
    const samples = [
      { amount: 12.8, description: 'Uber Eats Ponsonby dinner' },
      { amount: 7.4, description: 'McDonalds Queen Street' },
      { amount: 19.99, description: 'Netflix Subscription' },
      { amount: 42.5, description: 'Nike Online Store' },
    ];
    const sample = samples[Math.floor(Math.random() * samples.length)];

    setSimulating(true);
    try {
      await adapter.simulateTransaction({ userId: currentUserId, ...sample });
      const nextDashboard = await adapter.getHomeDashboard(currentUserId);
      setDashboard(nextDashboard);
      setServerError(false);
    } catch {
      setServerError(true);
    } finally {
      setSimulating(false);
    }
  };

  if (serverError) {
    return <ServerUnavailable />;
  }

  if (!dashboard) {
    return <Loading />;
  }

  const maxSpend = Math.max(...dashboard.leaderboard.map((row) => row.weeklyBadSpend));
  const carouselSideInset = spacing.lg;
  const carouselPeek = 26;
  const carouselGap = spacing.md;
  /** One slide width: left gutter (`carouselSideInset`) + card + peek of neighbour = viewport width */
  const carouselCardWidth = width - carouselSideInset - carouselPeek;
  const carouselSnapStride = carouselSideInset + carouselCardWidth + carouselGap - carouselPeek;
  const challengeCopy = getWeeklyChallengeHomeDisplay(dashboard.challenge);

  const snapCarouselToNearest = (offsetX: number, animated = true) => {
    const target = offsetX <= carouselSnapStride / 2 ? 0 : carouselSnapStride;
    const distance = Math.abs(offsetX - target);
    /** Avoid tiny jittery scroll corrections when we're already snapped. */
    if (distance < 2.5) {
      return;
    }
    carouselRef.current?.scrollTo({ x: target, animated });
  };

  const onCarouselMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    snapCarouselToNearest(event.nativeEvent.contentOffset.x, true);
  };

  /** When the user lifts a finger without much fling inertia, RN may not momentum-scroll — snap immediately. */
  const onCarouselScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const vx = event.nativeEvent.velocity?.x ?? 0;
    if (Math.abs(vx) >= 0.28) {
      return;
    }
    snapCarouselToNearest(event.nativeEvent.contentOffset.x, true);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} style={styles.scroll}>
      <AppHeader />

      <View
        accessibilityLabel={`This week's challenge: ${challengeCopy.title}. ${challengeCopy.description} ${challengeCopy.metaLine}`}
        accessible
        style={styles.weeklyChallengeSection}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>This week&apos;s challenge</Text>
        </View>
        <Text style={styles.challengeTitleLine}>{challengeCopy.title}</Text>
        <Text style={styles.challengeBodyLine}>{challengeCopy.description}</Text>
        {challengeCopy.metaTinted ? (
          <View style={styles.challengeMetaRow}>
            <Text style={styles.challengeMetaDate}>{challengeCopy.metaTinted.datePart}</Text>
            <Text style={styles.challengeMetaSep}>·</Text>
            <Text style={styles.challengeMetaCategory}>{challengeCopy.metaTinted.category}</Text>
            <Text style={styles.challengeMetaSep}>·</Text>
            <Text style={styles.challengeMetaPoints}>+{challengeCopy.metaTinted.points} points</Text>
          </View>
        ) : (
          <Text style={styles.challengeMetaLine}>{challengeCopy.metaLine}</Text>
        )}
      </View>

      <Pressable accessibilityRole="button" disabled={simulating} onPress={simulateTransaction} style={({ pressed }) => [styles.simulateButton, pressed && styles.pressed, simulating && styles.disabled]}>
        <Text style={styles.simulateText}>{simulating ? 'Simulating...' : 'Simulate Transaction'}</Text>
      </Pressable>

      <Animated.ScrollView
        ref={carouselRef}
        contentContainerStyle={[styles.carouselContent, { paddingHorizontal: carouselSideInset }]}
        decelerationRate="fast"
        directionalLockEnabled
        horizontal
        scrollEnabled={carouselScrollEnabled}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        style={styles.carousel}
        onMomentumScrollEnd={onCarouselMomentumScrollEnd}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: carouselScrollX } } }],
          { useNativeDriver: true },
        )}
        onScrollEndDrag={onCarouselScrollEndDrag}
      >
        <View style={[styles.carouselCard, { width: carouselCardWidth }]}>
          <Card style={styles.carouselInnerCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Weekly Leaderboard</Text>
            </View>
            {dashboard.leaderboard.slice(0, 4).map((row) => (
              <LeaderboardRow key={row.userId} row={row} maxSpend={maxSpend} currentUserId={currentUserId} />
            ))}
          </Card>
        </View>
        <View style={[styles.carouselCard, { width: carouselCardWidth }]}>
          <SpendingGraphCard
            compact
            currentUserId={currentUserId}
            graph={dashboard.graph}
            onScrubEnd={() => setCarouselScrollEnabled(true)}
            onScrubStart={() => setCarouselScrollEnabled(false)}
            title="Weekly Spending"
          />
        </View>
      </Animated.ScrollView>
      <View style={styles.carouselDots}>
        <View style={styles.carouselDotTrack}>
          {[0, 1].map((index) => (
            <View key={index} style={styles.carouselDot} />
          ))}
          <Animated.View
            style={[
              styles.activeCarouselDot,
              {
                transform: [
                  {
                    translateX: carouselScrollX.interpolate({
                      inputRange: [0, carouselSnapStride],
                      outputRange: [0, 15],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      </View>

      <Card>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Live Feed</Text>
          <Text style={styles.feedCount}>{dashboard.activityFeed.length}</Text>
        </View>
        {dashboard.activityFeed.map((item) => (
          <ActivityFeedItem currentUserId={currentUserId} item={item} key={item.id} />
        ))}
      </Card>
    </ScrollView>
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
  scroll: {
    backgroundColor: colors.background,
  },
  content: {
    backgroundColor: colors.background,
    gap: spacing.screenGap,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  carousel: {
    marginHorizontal: -spacing.lg,
  },
  carouselContent: {
    alignItems: 'stretch',
    flexGrow: 1,
  },
  carouselCard: {
    marginRight: spacing.md,
  },
  carouselInnerCard: {
    minHeight: 374,
  },
  carouselDots: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -spacing.sm,
  },
  carouselDotTrack: {
    flexDirection: 'row',
    gap: spacing.sm,
    height: 8,
    position: 'relative',
    width: 29,
  },
  carouselDot: {
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 7,
    width: 7,
  },
  activeCarouselDot: {
    backgroundColor: colors.green,
    borderRadius: 999,
    height: 7,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 14,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 21,
  },
  feedCount: {
    color: colors.textSoft,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
  },
  simulateButton: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 16,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  simulateText: {
    color: colors.surface,
    fontFamily: fonts.bodySemi,
    fontSize: 16,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.55,
  },
  weeklyChallengeSection: {
    backgroundColor: colors.mint,
    borderColor: colors.green,
    borderLeftWidth: 4,
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  /** Matches `LeaderboardRow` name line (15 / bodySemi / textSoft). */
  challengeTitleLine: {
    color: colors.textSoft,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    lineHeight: 20,
  },
  /** Secondary body under leaderboard title rows. */
  challengeBodyLine: {
    color: colors.textSoft,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  /** Matches `LeaderboardRow` amount line (14 / bodySemi / text). */
  challengeMetaLine: {
    color: colors.text,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    lineHeight: 18,
  },
  /** Memories-style meta row: muted date, green category, mint accent for points. */
  challengeMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  challengeMetaDate: {
    color: colors.textSoft,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 18,
  },
  challengeMetaSep: {
    color: colors.textSoft,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 18,
  },
  challengeMetaCategory: {
    color: colors.green,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    lineHeight: 18,
    textTransform: 'capitalize',
  },
  challengeMetaPoints: {
    color: colors.mintStrong,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    lineHeight: 18,
  },
});
