import { StyleSheet, Text, View } from 'react-native';

import type { ActivityFeedItem as ActivityFeedItemType } from '../data/types';
import { colors, fonts, spacing } from '../theme';
import { formatCurrency } from '../utils/format';
import { Avatar } from './Avatar';

type ActivityFeedItemProps = {
  item: ActivityFeedItemType;
  currentUserId: string;
};

export function ActivityFeedItem({ item, currentUserId }: ActivityFeedItemProps) {
  const isCurrentUser = item.userId === currentUserId;

  return (
    <View style={[styles.row, isCurrentUser && styles.currentRow]}>
      {!isCurrentUser ? (
        <Avatar name={item.displayName} uri={item.avatarUrl} color={item.avatarColor} size={34} />
      ) : null}
      <View style={[styles.bubbleWrap, isCurrentUser ? styles.currentBubbleWrap : styles.otherBubbleWrap]}>
        <Text style={[styles.actor, isCurrentUser && styles.currentActor]}>{isCurrentUser ? 'You' : item.displayName}</Text>
        <Text style={[styles.message, isCurrentUser && styles.currentMessage]}>
          Just spent {formatCurrency(item.amount)} on {item.merchant}
        </Text>
      </View>
      {isCurrentUser ? (
        <Avatar name={item.displayName} uri={item.avatarUrl} color={item.avatarColor} size={34} />
      ) : null}
    </View>
  );
}


const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-start',
    paddingVertical: 6,
  },
  currentRow: {
    justifyContent: 'flex-end',
  },
  bubbleWrap: {
    borderRadius: 20,
    flexShrink: 1,
    maxWidth: '76%',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  otherBubbleWrap: {
    backgroundColor: 'rgba(241, 243, 245, 0.92)',
    borderBottomLeftRadius: 6,
  },
  currentBubbleWrap: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(184, 242, 208, 0.72)',
    borderBottomRightRadius: 6,
  },
  actor: {
    color: colors.text,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },
  currentActor: {
    textAlign: 'left',
  },
  message: {
    color: colors.text,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  currentMessage: {
    textAlign: 'left',
  },
});
