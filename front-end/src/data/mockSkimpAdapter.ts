import {
  friendGroups,
  groupMembers,
  profiles,
  recapShells,
  transactions,
  weeklyChallenges,
  weeklyResults,
} from './mockSeed';
import { MOCK_ACTIVE_CHALLENGE_ID } from './mockDemoWeeklyChallenges';
import type {
  ActivityFeedItem,
  DailyBreakdown,
  GraphPoint,
  LeaderboardRow,
  Medal,
  PointsLeaderboardRow,
  Profile,
  SkimpDataAdapter,
  Transaction,
  WeeklyChallenge,
  WeeklyGraph,
  WeeklyRecap,
} from './types';

export const MOCK_CURRENT_USER_ID = 'user-connor';
export const MOCK_CURRENT_GROUP_ID = 'group-skimp-squad';
export const MOCK_CURRENT_CHALLENGE_ID = MOCK_ACTIVE_CHALLENGE_ID;

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const cents = (amount: number) => Math.round(amount * 100);
const money = (amount: number) => Math.round(amount * 100) / 100;

const findProfile = (userId: string): Profile => {
  const profile = profiles.find((item) => item.id === userId);
  if (!profile) {
    throw new Error(`Missing profile for ${userId}`);
  }

  return profile;
};

const findChallenge = (challengeId: string): WeeklyChallenge => {
  const challenge = weeklyChallenges.find((item) => item.id === challengeId);
  if (!challenge) {
    throw new Error(`Missing weekly challenge ${challengeId}`);
  }

  return challenge;
};

const activeGroupMemberIds = (groupId: string) =>
  groupMembers
    .filter((member) => member.groupId === groupId && !member.leftAt)
    .slice(0, 8)
    .map((member) => member.userId);

const isInChallenge = (transaction: Transaction, challenge: WeeklyChallenge) =>
  transaction.challengeId === challenge.id &&
  transaction.groupId === challenge.groupId &&
  transaction.category !== undefined &&
  challenge.badCategorySnapshot.includes(transaction.category);

const compareNewest = (a: Transaction, b: Transaction) =>
  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();

const weeklyBadTransactions = (groupId: string, challengeId: string) => {
  const challenge = findChallenge(challengeId);

  return transactions.filter(
    (transaction) => transaction.groupId === groupId && isInChallenge(transaction, challenge),
  );
};

const medalForRank = (rank: number): Medal | undefined => {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  return undefined;
};

const getDayIndex = (isoTimestamp: string) => new Date(isoTimestamp).getUTCDay();

const buildPointsLeaderboard = (groupId: string): PointsLeaderboardRow[] =>
  activeGroupMemberIds(groupId)
    .map((userId) => {
      const profile = findProfile(userId);

      return {
        userId,
        displayName: profile.displayName,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        avatarColor: profile.avatarColor,
        totalPoints: profile.totalPoints,
        rank: 0,
      } satisfies PointsLeaderboardRow;
    })
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      medal: medalForRank(index + 1),
    }));

const buildLeaderboard = (groupId: string, challengeId: string): LeaderboardRow[] => {
  const weeklyTransactions = weeklyBadTransactions(groupId, challengeId);
  const rows = activeGroupMemberIds(groupId).map((userId) => {
    const profile = findProfile(userId);
    const totalInCents = weeklyTransactions
      .filter((transaction) => transaction.userId === userId)
      .reduce((sum, transaction) => sum + cents(transaction.amount), 0);

    return {
      userId,
      displayName: profile.displayName,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      avatarColor: profile.avatarColor,
      weeklyBadSpend: money(totalInCents / 100),
      rank: 0,
      trend: totalInCents < 6000 ? 'up' : totalInCents > 9000 ? 'down' : 'flat',
    } satisfies LeaderboardRow;
  });

  return rows
    .sort((a, b) => a.weeklyBadSpend - b.weeklyBadSpend)
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      medal: medalForRank(index + 1),
    }));
};

const dateForDay = (challenge: WeeklyChallenge, dayIndex: number) => {
  const date = new Date(`${challenge.startDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + dayIndex);
  return date.toISOString().slice(0, 10);
};

const buildGraph = (groupId: string, challengeId: string): WeeklyGraph => {
  const challenge = findChallenge(challengeId);
  const weeklyTransactions = weeklyBadTransactions(groupId, challengeId);

  const series = activeGroupMemberIds(groupId).map((userId) => {
    const profile = findProfile(userId);
    let runningCents = 0;

    const points: GraphPoint[] = dayLabels.map((day, dayIndex) => {
      const dayCents = weeklyTransactions
        .filter((transaction) => transaction.userId === userId && getDayIndex(transaction.timestamp) === dayIndex)
        .reduce((sum, transaction) => sum + cents(transaction.amount), 0);

      runningCents += dayCents;

      return {
        day,
        dayIndex,
        date: dateForDay(challenge, dayIndex),
        cumulativeAmount: money(runningCents / 100),
      };
    });

    return {
      userId,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      avatarColor: profile.avatarColor,
      points,
    };
  });

  return {
    days: dayLabels,
    series,
  };
};

const buildActivityFeed = (groupId: string, limit = 8): ActivityFeedItem[] =>
  transactions
    .filter((transaction) => transaction.groupId === groupId && transaction.isBadSpend)
    .sort(compareNewest)
    .slice(0, limit)
    .map((transaction) => {
      const profile = findProfile(transaction.userId);
      return {
        id: transaction.id,
        userId: transaction.userId,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        avatarColor: profile.avatarColor,
        merchant: transaction.merchant,
        amount: transaction.amount,
        category: transaction.category,
        timestamp: transaction.timestamp,
        tone: transaction.amount >= 50 ? 'nudge' : transaction.userId === MOCK_CURRENT_USER_ID ? 'neutral' : 'celebration',
      };
    });

const buildDailyBreakdown = (groupId: string, challengeId: string): DailyBreakdown[] => {
  const weeklyTransactions = weeklyBadTransactions(groupId, challengeId);

  return dayLabels.map((day, dayIndex) => ({
    day,
    amount: money(
      weeklyTransactions
        .filter((transaction) => getDayIndex(transaction.timestamp) === dayIndex)
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    ),
  }));
};

const buildRecapFromCurrentShape = (shell: (typeof recapShells)[number]): WeeklyRecap => {
  const challengeId = shell.challengeId;
  const currentLeaderboard = buildLeaderboard(MOCK_CURRENT_GROUP_ID, challengeId);
  const shiftedLeaderboard = currentLeaderboard.map((row, index) => ({
    ...row,
    weeklyBadSpend: money(Math.max(18.2, row.weeklyBadSpend - 11 + index * 2.75)),
    rank: index + 1,
    medal: medalForRank(index + 1),
  }));

  return {
    ...shell,
    finalLeaderboard: shiftedLeaderboard,
    graph: buildGraph(MOCK_CURRENT_GROUP_ID, challengeId),
    dailyBreakdown: buildDailyBreakdown(MOCK_CURRENT_GROUP_ID, challengeId),
  };
};

export const mockSkimpAdapter: SkimpDataAdapter = {
  async joinDemo(displayName) {
    return {
      userId: MOCK_CURRENT_USER_ID,
      username: displayName.trim() || 'connor',
      displayName: displayName.trim() || 'connor',
      groupId: MOCK_CURRENT_GROUP_ID,
      groupName: 'Skimp Squad',
      inviteCode: 'SKIMP8',
      challengeId: MOCK_CURRENT_CHALLENGE_ID,
    };
  },

  async getHomeDashboard(userId) {
    const profile = findProfile(userId);
    const group = friendGroups[0];
    const challenge = weeklyChallenges.find((item) => item.groupId === group.id && item.isActive);

    if (!challenge) {
      throw new Error('No active weekly challenge found');
    }

    return {
      profile,
      group,
      challenge,
      leaderboard: buildLeaderboard(group.id, challenge.id),
      graph: buildGraph(group.id, challenge.id),
      activityFeed: buildActivityFeed(group.id),
    };
  },

  async getWeeklyLeaderboard(groupId, challengeId) {
    return buildLeaderboard(groupId, challengeId);
  },

  async getPointsLeaderboard(groupId) {
    return buildPointsLeaderboard(groupId);
  },

  async getWeeklyCumulativeSpend(groupId, challengeId) {
    return buildGraph(groupId, challengeId);
  },

  async getActivityFeed(groupId, limit = 8) {
    return buildActivityFeed(groupId, limit);
  },

  async simulateTransaction(input) {
    const transaction: Transaction = {
      id: `txn-sim-${Date.now()}`,
      userId: input.userId,
      groupId: MOCK_CURRENT_GROUP_ID,
      challengeId: MOCK_CURRENT_CHALLENGE_ID,
      amount: input.amount,
      currency: 'NZD',
      description: input.description,
      merchant: input.description.split(' ')[0] || 'Transaction',
      timestamp: input.timestamp ?? new Date().toISOString(),
      category: 'other',
      categoryMethod: 'manual',
      categorizedAt: new Date().toISOString(),
      isBadSpend: false,
      needsReview: false,
      sourceTransactionId: `mock-${Date.now()}`,
    };
    transactions.unshift(transaction);
    return transaction;
  },

  async getProfileSummary(userId, groupId, challengeId) {
    const leaderboard = buildLeaderboard(groupId, challengeId);
    const currentRow = leaderboard.find((row) => row.userId === userId);
    const recentTransactions = await this.getUserTransactions(userId, 3);

    if (!currentRow) {
      throw new Error(`User ${userId} is not on the active leaderboard`);
    }

    const medals = weeklyResults
      .filter((result) => result.userId === userId)
      .reduce(
        (summary, result) => ({
          ...summary,
          [result.medal]: summary[result.medal] + 1,
        }),
        { gold: 0, silver: 0, bronze: 0 } satisfies Record<Medal, number>,
      );

    return {
      profile: findProfile(userId),
      medals,
      weeklySpend: currentRow.weeklyBadSpend,
      averageDailySpend: money(currentRow.weeklyBadSpend / 7),
      currentRank: currentRow.rank,
      recentTransactions,
    };
  },

  async getUserTransactions(userId, limit) {
    const rows = transactions.filter((transaction) => transaction.userId === userId).sort(compareNewest);
    return typeof limit === 'number' ? rows.slice(0, limit) : rows;
  },

  async getWeeklyRecaps(groupId) {
    return recapShells.filter((shell) => shell.groupId === groupId).map(buildRecapFromCurrentShape);
  },

  async getWeeklyRecap(groupId, challengeId) {
    const recap = recapShells.find((shell) => shell.groupId === groupId && shell.challengeId === challengeId);

    if (!recap) {
      throw new Error(`Missing recap for ${groupId}/${challengeId}`);
    }

    return buildRecapFromCurrentShape(recap);
  },
};
