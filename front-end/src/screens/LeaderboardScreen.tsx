import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';

import { AppHeader } from '../components/AppHeader';
import { Avatar } from '../components/Avatar';
import { Card } from '../components/Card';
import { ServerUnavailable } from '../components/ServerUnavailable';
import type { PointsLeaderboardRow, SkimpDataAdapter } from '../data/types';
import { colors, fonts, spacing } from '../theme';

type LeaderboardScreenProps = {
  adapter: SkimpDataAdapter;
  groupId: string;
  challengeId: string;
  currentUserId: string;
};

const medalImages = {
  gold: require('../../Gold Medal.png'),
  silver: require('../../Silver Medal.png'),
  bronze: require('../../Bronze Medal.png'),
};

export function LeaderboardScreen({ adapter, groupId, currentUserId }: LeaderboardScreenProps) {
  const [leaderboard, setLeaderboard] = useState<PointsLeaderboardRow[]>();
  const [serverError, setServerError] = useState(false);

  useEffect(() => {
    adapter.getPointsLeaderboard(groupId)
      .then((rows) => {
        setLeaderboard(rows);
        setServerError(false);
      })
      .catch(() => setServerError(true));
  }, [adapter, groupId]);

  if (serverError) {
    return <ServerUnavailable />;
  }

  if (!leaderboard) {
    return <Loading />;
  }

  const topThree = leaderboard.slice(0, 3);
  const podiumOrder = [topThree[1], topThree[0], topThree[2]].filter(Boolean) as PointsLeaderboardRow[];
  const remainingRows = leaderboard.slice(3);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} style={styles.scroll}>
      <AppHeader />

      <Card style={styles.leaderboardCard}>
        <Text style={styles.title}>Leaderboard</Text>

        <View style={styles.podiumRow}>
          {podiumOrder.map((row) => (
            <PodiumPerson currentUserId={currentUserId} key={row.userId} row={row} />
          ))}
        </View>

        <View style={styles.rowsList}>
          {remainingRows.map((row) => (
            <View key={row.userId} style={[styles.pointsRow, row.userId === currentUserId && styles.currentPointsRow]}>
              <Text style={styles.pointsRank}>{row.rank}</Text>
              <Avatar name={row.displayName} uri={row.avatarUrl} color={row.avatarColor} size={38} />
              <Text style={[styles.pointsName, row.userId === currentUserId && styles.currentPointsName]}>
                {row.userId === currentUserId ? 'You' : row.displayName}
              </Text>
              <Text style={styles.pointsValue}>{row.totalPoints} pts</Text>
            </View>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}

function PodiumPerson({ row, currentUserId }: { row: PointsLeaderboardRow; currentUserId: string }) {
  const medal = row.rank === 1 ? 'gold' : row.rank === 2 ? 'silver' : 'bronze';
  const isCurrentUser = row.userId === currentUserId;

  return (
    <View style={[styles.podiumCard, row.rank === 1 && styles.firstPodiumCard]}>
      <View style={[styles.podiumAvatarWrap, row.rank === 1 && styles.firstAvatarWrap]}>
        <Avatar name={row.displayName} uri={row.avatarUrl} color={row.avatarColor} size={row.rank === 1 ? 76 : 64} />
        <Image source={medalImages[medal]} style={[styles.podiumMedal, row.rank === 1 && styles.firstPodiumMedal]} />
      </View>
      <Text numberOfLines={1} style={styles.podiumName}>{isCurrentUser ? 'You' : row.displayName}</Text>
      <Text style={styles.podiumPoints}>{row.totalPoints} pts</Text>
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
  leaderboardCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 32,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  podiumRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  podiumCard: {
    alignItems: 'center',
    backgroundColor: '#F1FFF7',
    borderColor: colors.surface,
    borderRadius: 20,
    borderWidth: 2,
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'flex-end',
    minHeight: 178,
    padding: spacing.md,
    shadowColor: '#121212',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  firstPodiumCard: {
    minHeight: 218,
    paddingTop: spacing.lg,
  },
  podiumAvatarWrap: {
    alignItems: 'center',
    height: 76,
    justifyContent: 'center',
    position: 'relative',
    width: 76,
  },
  firstAvatarWrap: {
    height: 90,
    width: 90,
  },
  podiumMedal: {
    bottom: 2,
    height: 27,
    position: 'absolute',
    right: 2,
    width: 27,
  },
  firstPodiumMedal: {
    bottom: 2,
    height: 33,
    right: 2,
    width: 33,
  },
  podiumName: {
    color: colors.text,
    fontFamily: fonts.headingSemi,
    fontSize: 16,
    maxWidth: 96,
    textAlign: 'center',
  },
  podiumPoints: {
    color: colors.text,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
  rowsList: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.md,
    shadowColor: '#121212',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  pointsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  currentPointsRow: {
    backgroundColor: '#F0FFF7',
    borderRadius: 18,
  },
  pointsRank: {
    color: colors.muted,
    fontFamily: fonts.headingSemi,
    fontSize: 18,
    textAlign: 'center',
    width: 28,
  },
  pointsName: {
    color: colors.text,
    flex: 1,
    fontFamily: fonts.bodySemi,
    fontSize: 17,
  },
  currentPointsName: {
    color: colors.green,
  },
  pointsValue: {
    color: colors.mintStrong,
    fontFamily: fonts.bodySemi,
    fontSize: 16,
  },
});
