import { Expand, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ActivityFeedItem } from '../components/ActivityFeedItem';
import { AppHeader } from '../components/AppHeader';
import { Card } from '../components/Card';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { ServerUnavailable } from '../components/ServerUnavailable';
import { SpendingGraphCard } from '../components/SpendingGraphCard';
import type { HomeDashboard, SkimpDataAdapter } from '../data/types';
import { colors, fonts, spacing } from '../theme';

type HomeScreenProps = {
  adapter: SkimpDataAdapter;
  currentUserId: string;
  onResetSession?: () => void;
};

export function HomeScreen({ adapter, currentUserId, onResetSession }: HomeScreenProps) {
  const [dashboard, setDashboard] = useState<HomeDashboard>();
  const [serverError, setServerError] = useState<unknown>();
  const [feedModalOpen, setFeedModalOpen] = useState(false);
  const [carouselScrollEnabled, setCarouselScrollEnabled] = useState(true);
  const carouselScrollX = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      adapter.getHomeDashboard(currentUserId)
        .then((nextDashboard) => {
          if (!cancelled) {
            setDashboard(nextDashboard);
            setServerError(undefined);
          }
        })
        .catch((error) => {
          if (!cancelled) {
            setServerError(error);
          }
        });
    };

    load();
    const poll = setInterval(load, 2000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [adapter, currentUserId]);

  if (serverError) {
    return <ServerUnavailable error={serverError} onResetSession={onResetSession} />;
  }

  if (!dashboard) {
    return <Loading />;
  }

  const maxSpend = Math.max(...dashboard.leaderboard.map((row) => row.weeklyBadSpend));
  const carouselCardWidth = Math.min(width - spacing.lg * 2, 420);
  const newestFeedItems = [...dashboard.activityFeed].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const previewFeedItems = newestFeedItems.slice(0, 5);

  return (
    <>
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

        <Pressable
          accessibilityRole="button"
          onPress={() => setFeedModalOpen(true)}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Card>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Live Feed</Text>
              <View style={styles.feedHeaderRight}>
                <Text style={styles.feedCount}>{dashboard.activityFeed.length}</Text>
                <View style={styles.expandIcon}>
                  <Expand color={colors.green} size={17} strokeWidth={2.4} />
                </View>
              </View>
            </View>
            <View style={styles.feedPreviewList} pointerEvents="none">
              {previewFeedItems.map((item) => (
                <ActivityFeedItem currentUserId={currentUserId} item={item} key={item.id} />
              ))}
            </View>
          </Card>
        </Pressable>
      </ScrollView>

      <Modal animationType="slide" onRequestClose={() => setFeedModalOpen(false)} presentationStyle="fullScreen" visible={feedModalOpen}>
        <View style={styles.modalRoot}>
          <View style={styles.modalTopBar}>
            <View>
              <Text style={styles.modalTitle}>Live Feed</Text>
              <Text style={styles.modalSubtitle}>Newest transactions first</Text>
            </View>
            <Pressable accessibilityLabel="Close live feed" accessibilityRole="button" onPress={() => setFeedModalOpen(false)} style={styles.closeButton}>
              <X color={colors.text} size={22} strokeWidth={2.5} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator>
            {newestFeedItems.map((item) => (
              <ActivityFeedItem currentUserId={currentUserId} item={item} key={item.id} />
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
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
  feedHeaderRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  expandIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  feedPreviewList: {
    maxHeight: 305,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.7,
  },
  modalRoot: {
    backgroundColor: colors.background,
    flex: 1,
  },
  modalTopBar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.xl,
  },
  modalTitle: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 25,
  },
  modalSubtitle: {
    color: colors.textSoft,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  modalContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
