import type {
  ActivityFeedItem,
  HomeDashboard,
  LeaderboardRow,
  PointsLeaderboardRow,
  ProfileSummary,
  SkimpDataAdapter,
  SpendingCategory,
  Transaction,
  WeeklyGraph,
  WeeklyRecap,
} from './types';

const env =
  (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

export const SKIMP_API_BASE_URL = (env.EXPO_PUBLIC_SKIMP_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');
export const API_CURRENT_USER_ID = env.EXPO_PUBLIC_SKIMP_CURRENT_USER_ID ?? '00000000-0000-0000-0000-000000000001';
export const API_CURRENT_GROUP_ID = env.EXPO_PUBLIC_SKIMP_CURRENT_GROUP_ID ?? '00000000-0000-0000-0000-000000000100';
export const API_CURRENT_CHALLENGE_ID = env.EXPO_PUBLIC_SKIMP_CURRENT_CHALLENGE_ID ?? '00000000-0000-0000-0000-000000000200';

const categories: SpendingCategory[] = [
  'eating_out',
  'groceries',
  'clothing',
  'transport',
  'rent',
  'subscriptions',
  'entertainment',
  'other',
];

const normalizeCategory = (category?: string): SpendingCategory =>
  categories.includes(category as SpendingCategory) ? (category as SpendingCategory) : 'other';

const normalizeTransaction = (transaction: Transaction): Transaction => ({
  ...transaction,
  id: String(transaction.id),
  userId: String(transaction.userId),
  groupId: String(transaction.groupId),
  challengeId: String(transaction.challengeId),
  amount: Number(transaction.amount ?? 0),
  currency: transaction.currency ?? 'NZD',
  merchant: transaction.merchant || transaction.description || 'Transaction',
  timestamp: transaction.timestamp,
  category: normalizeCategory(transaction.category),
  categoryMethod: transaction.categoryMethod ?? 'manual',
  isBadSpend: Boolean(transaction.isBadSpend),
  needsReview: Boolean(transaction.needsReview),
  sourceTransactionId: transaction.sourceTransactionId ?? `backend-${transaction.id}`,
});

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${SKIMP_API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Server Unavaliable: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const apiSkimpAdapter: SkimpDataAdapter = {
  async getHomeDashboard(userId) {
    const dashboard = await request<HomeDashboard>(`/api/dashboard?userId=${encodeURIComponent(userId)}`);
    return {
      ...dashboard,
      activityFeed: dashboard.activityFeed.map((item) => ({
        ...item,
        userId: String(item.userId),
        category: normalizeCategory(item.category),
      })),
    };
  },

  async getWeeklyLeaderboard(groupId, challengeId) {
    return request<LeaderboardRow[]>(`/api/groups/${groupId}/leaderboard?challengeId=${encodeURIComponent(challengeId)}`);
  },

  async getPointsLeaderboard(groupId) {
    const rows = await request<PointsLeaderboardRow[]>(`/api/groups/${groupId}/points-leaderboard`);
    return rows.map((row) => ({ ...row, userId: String(row.userId) }));
  },

  async getWeeklyCumulativeSpend(groupId, challengeId) {
    return request<WeeklyGraph>(`/api/groups/${groupId}/weekly-graph?challengeId=${encodeURIComponent(challengeId)}`);
  },

  async getActivityFeed(groupId, limit = 8) {
    const feed = await request<ActivityFeedItem[]>(`/api/groups/${groupId}/activity-feed?limit=${limit}`);
    return feed.map((item) => ({ ...item, userId: String(item.userId), category: normalizeCategory(item.category) }));
  },

  async simulateTransaction(input) {
    const timestamp = input.timestamp ?? new Date().toISOString().slice(0, 19);
    const transaction = await request<Transaction>('/api/transactions/simulate', {
      method: 'POST',
      body: JSON.stringify({
        userId: input.userId,
        amount: input.amount,
        description: input.description,
        timestamp,
      }),
    });

    return normalizeTransaction(transaction);
  },

  async getProfileSummary(userId, groupId, challengeId) {
    const summary = await request<ProfileSummary>(
      `/api/users/${userId}/profile-summary?groupId=${groupId}&challengeId=${encodeURIComponent(challengeId)}`,
    );
    return {
      ...summary,
      recentTransactions: summary.recentTransactions.map(normalizeTransaction),
    };
  },

  async getUserTransactions(userId, limit) {
    const query = typeof limit === 'number' ? `?limit=${limit}` : '';
    const transactions = await request<Transaction[]>(`/api/users/${userId}/transactions${query}`);
    return transactions.map(normalizeTransaction);
  },

  async getWeeklyRecaps(groupId) {
    return request<WeeklyRecap[]>(`/api/groups/${groupId}/weekly-recaps`);
  },

  async getWeeklyRecap(groupId, challengeId) {
    const recaps = await this.getWeeklyRecaps(groupId);
    const recap = recaps.find((item) => item.challengeId === challengeId);
    if (!recap) {
      throw new Error('Server Unavaliable: missing weekly recap');
    }
    return recap;
  },
};
