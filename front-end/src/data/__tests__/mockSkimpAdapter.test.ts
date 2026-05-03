import { describe, expect, it } from 'vitest';

import {
  MOCK_CURRENT_CHALLENGE_ID,
  MOCK_CURRENT_GROUP_ID,
  MOCK_CURRENT_USER_ID,
  mockSkimpAdapter,
} from '../mockSkimpAdapter';
import { categorizeTransactionForStorage } from '../transactionCategorization';

describe('mockSkimpAdapter', () => {
  it('orders the weekly leaderboard by lowest bad-category spend', async () => {
    const leaderboard = await mockSkimpAdapter.getWeeklyLeaderboard(
      MOCK_CURRENT_GROUP_ID,
      MOCK_CURRENT_CHALLENGE_ID,
    );

    expect(leaderboard.map((row) => row.displayName)).toEqual([
      'Maya',
      'Connor',
      'Josh',
      'Taylor',
      'Sam',
      'Jordan',
      'Alex',
      'Jamie',
    ]);
    expect(leaderboard.map((row) => row.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(leaderboard[0].medal).toBe('gold');
    expect(leaderboard[1].medal).toBe('silver');
    expect(leaderboard[2].medal).toBe('bronze');
  });

  it('orders the main points leaderboard by highest total points without changing weekly spend ranks', async () => {
    const pointsLeaderboard = await mockSkimpAdapter.getPointsLeaderboard(MOCK_CURRENT_GROUP_ID);
    const weeklyLeaderboard = await mockSkimpAdapter.getWeeklyLeaderboard(
      MOCK_CURRENT_GROUP_ID,
      MOCK_CURRENT_CHALLENGE_ID,
    );

    expect(pointsLeaderboard.map((row) => row.displayName)).toEqual([
      'Maya',
      'Connor',
      'Josh',
      'Taylor',
      'Sam',
      'Jordan',
      'Alex',
      'Jamie',
    ]);
    expect(pointsLeaderboard.map((row) => row.totalPoints)).toEqual([
      164, 135, 128, 120, 112, 108, 104, 96,
    ]);
    expect(weeklyLeaderboard[0]).toMatchObject({ displayName: 'Maya', weeklyBadSpend: 22.1 });
  });

  it('builds cumulative weekly graph totals by carrying spend forward each day', async () => {
    const graph = await mockSkimpAdapter.getWeeklyCumulativeSpend(
      MOCK_CURRENT_GROUP_ID,
      MOCK_CURRENT_CHALLENGE_ID,
    );

    const currentUser = graph.series.find((line) => line.userId === MOCK_CURRENT_USER_ID);

    expect(graph.days).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    expect(currentUser?.points.map((point) => point.cumulativeAmount)).toEqual([
      10.5, 23.1, 23.1, 43.35, 43.35, 43.35, 43.35,
    ]);
  });

  it('returns profile stats from current-week bad-category spend and medal history', async () => {
    const profile = await mockSkimpAdapter.getProfileSummary(
      MOCK_CURRENT_USER_ID,
      MOCK_CURRENT_GROUP_ID,
      MOCK_CURRENT_CHALLENGE_ID,
    );

    expect(profile.weeklySpend).toBe(43.35);
    expect(profile.averageDailySpend).toBe(6.19);
    expect(profile.currentRank).toBe(2);
    expect(profile.medals).toEqual({ gold: 3, silver: 2, bronze: 1 });
    expect(profile.recentTransactions).toHaveLength(3);
    expect(profile.recentTransactions[0]).toMatchObject({
      merchant: 'New World',
      category: 'groceries',
      isBadSpend: false,
    });
    expect(profile.recentTransactions).toContainEqual(expect.objectContaining({
      merchant: 'Gong Cha',
      category: 'eating_out',
      isBadSpend: true,
    }));

    await expect(mockSkimpAdapter.getUserTransactions(MOCK_CURRENT_USER_ID)).resolves.toHaveLength(6);
  });
});

describe('categorizeTransactionForStorage', () => {
  it('does not call the classifier when a transaction already has a category', async () => {
    const result = await categorizeTransactionForStorage({
      transaction: {
        id: 'txn-existing',
        userId: MOCK_CURRENT_USER_ID,
        groupId: MOCK_CURRENT_GROUP_ID,
        challengeId: MOCK_CURRENT_CHALLENGE_ID,
        amount: 8.5,
        currency: 'NZD',
        description: 'McDonalds Queen Street',
        merchant: 'McDonalds',
        timestamp: '2026-04-27T21:15:00.000Z',
        category: 'eating_out',
        categoryMethod: 'cache',
        categorizedAt: '2026-04-27T21:15:30.000Z',
        isBadSpend: true,
        needsReview: false,
        sourceTransactionId: 'bank-existing',
      },
      badCategories: ['eating_out'],
      merchantCache: {},
      classify: async () => {
        throw new Error('classifier should not run');
      },
    });

    expect(result.category).toBe('eating_out');
    expect(result.categoryMethod).toBe('cache');
  });

  it('uses merchant cache before falling back to the classifier', async () => {
    let classifierCalls = 0;

    const result = await categorizeTransactionForStorage({
      transaction: {
        id: 'txn-cache',
        userId: MOCK_CURRENT_USER_ID,
        groupId: MOCK_CURRENT_GROUP_ID,
        challengeId: MOCK_CURRENT_CHALLENGE_ID,
        amount: 18,
        currency: 'NZD',
        description: 'Uber Eats Auckland',
        merchant: 'Uber Eats',
        timestamp: '2026-04-29T08:20:00.000Z',
        isBadSpend: false,
        needsReview: false,
        sourceTransactionId: 'bank-cache',
      },
      badCategories: ['eating_out'],
      merchantCache: {
        'uber eats': { category: 'eating_out', method: 'cache' },
      },
      classify: async () => {
        classifierCalls += 1;
        return { category: 'other', method: 'llm', needsReview: true };
      },
    });

    expect(classifierCalls).toBe(0);
    expect(result.category).toBe('eating_out');
    expect(result.isBadSpend).toBe(true);
    expect(result.needsReview).toBe(false);
  });
});
