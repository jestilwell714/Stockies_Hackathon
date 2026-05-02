import { Image, StyleSheet, Text, View } from 'react-native';

import type { LeaderboardRow as LeaderboardRowType } from '../data/types';
import { colors, fonts, spacing } from '../theme';
import { formatCurrency } from '../utils/format';
import { Avatar } from './Avatar';

type LeaderboardRowProps = {
  row: LeaderboardRowType;
  maxSpend: number;
  currentUserId?: string;
};

const medalImages = {
  gold: require('../../Gold Medal.png'),
  silver: require('../../Silver Medal.png'),
  bronze: require('../../Bronze Medal.png'),
};

export function LeaderboardRow({ row, maxSpend, currentUserId }: LeaderboardRowProps) {
  const isCurrentUser = row.userId === currentUserId;
  const progress = maxSpend === 0 ? 0 : Math.max(0.06, row.weeklyBadSpend / maxSpend);
  return (
    <View style={[styles.row, isCurrentUser && styles.currentRow]}>
      <View style={styles.avatarWrap}>
        <Avatar name={row.displayName} uri={row.avatarUrl} color={row.avatarColor} size={42} />
        {row.medal ? (
          <Image source={medalImages[row.medal]} style={styles.medalBadgeImage} />
        ) : (
          <View style={styles.rankBadge}>
            <Text style={styles.rankBadgeText}>{row.rank}</Text>
          </View>
        )}
      </View>
      <View style={styles.main}>
        <View style={styles.titleLine}>
          <Text style={[styles.name, isCurrentUser && styles.currentName]}>
            {isCurrentUser ? 'You' : row.displayName}
          </Text>
          <Text style={styles.amount}>{formatCurrency(row.weeklyBadSpend)}</Text>
        </View>
        <View style={styles.track}>
          <View
            style={[
              styles.bar,
              {
                width: `${progress * 100}%`,
                backgroundColor: isCurrentUser ? colors.mintStrong : colors.blueStrong,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: 6,
  },
  currentRow: {
    backgroundColor: '#F0FFF7',
    borderRadius: 18,
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  avatarWrap: {
    height: 48,
    position: 'relative',
    width: 48,
  },
  medalBadgeImage: {
    bottom: -2,
    height: 24,
    position: 'absolute',
    right: -2,
    width: 24,
  },
  rankBadge: {
    alignItems: 'center',
    backgroundColor: colors.textSoft,
    borderColor: colors.surface,
    borderRadius: 999,
    borderWidth: 2,
    bottom: 0,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 20,
  },
  rankBadgeText: {
    color: colors.surface,
    fontFamily: fonts.headingSemi,
    fontSize: 10,
  },
  main: {
    flex: 1,
    gap: spacing.sm,
  },
  titleLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    color: colors.textSoft,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
  },
  currentName: {
    color: colors.green,
  },
  amount: {
    color: colors.text,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
  },
  track: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    height: 10,
    overflow: 'hidden',
  },
  bar: {
    borderRadius: 999,
    height: 10,
  },
});
