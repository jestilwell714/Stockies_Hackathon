import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ActivityFeedItem } from '../components/ActivityFeedItem';
import { AppHeader } from '../components/AppHeader';
import { Card } from '../components/Card';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { SpendingGraphCard } from '../components/SpendingGraphCard';
import type { HomeDashboard, SkimpDataAdapter } from '../data/types';
import { colors, fonts, spacing } from '../theme';

type HomeScreenProps = {
  adapter: SkimpDataAdapter;
  currentUserId: string;
};

export function HomeScreen({ adapter, currentUserId }: HomeScreenProps) {
  const [dashboard, setDashboard] = useState<HomeDashboard>();
  const [carouselScrollEnabled, setCarouselScrollEnabled] = useState(true);
  const carouselScrollX = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();

  useEffect(() => {
    adapter.getHomeDashboard(currentUserId).then(setDashboard);
  }, [adapter, currentUserId]);

  if (!dashboard) {
    return <Loading />;
  }

  const maxSpend = Math.max(...dashboard.leaderboard.map((row) => row.weeklyBadSpend));
  const carouselCardWidth = Math.min(width - spacing.lg * 2, 420);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} style={styles.scroll}>
      <AppHeader />

      <Animated.ScrollView
        decelerationRate="fast"
        horizontal
        pagingEnabled
        scrollEnabled={carouselScrollEnabled}
        showsHorizontalScrollIndicator={false}
        snapToInterval={carouselCardWidth + spacing.md}
        scrollEventThrottle={16}
        style={styles.carousel}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: carouselScrollX } } }],
          { useNativeDriver: true },
        )}
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
                      inputRange: [0, carouselCardWidth + spacing.md],
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
    paddingHorizontal: spacing.lg,
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
});
