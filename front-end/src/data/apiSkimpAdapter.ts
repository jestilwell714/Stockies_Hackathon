import { NativeModules, Platform } from 'react-native';

import type {
  ActivityFeedItem,
  ApiDebugInfo,
  DemoSession,
  HomeDashboard,
  LeaderboardRow,
  PointsLeaderboardRow,
  ProfileSummary,
  SkimpDataAdapter,
  SkimpApiError,
  SpendingCategory,
  Transaction,
  WeeklyGraph,
  WeeklyRecap,
} from './types';

const configuredApiBaseUrl = process.env.EXPO_PUBLIC_SKIMP_API_URL?.replace(/\/$/, '');

const inferExpoGoApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return undefined;
  }

  const scriptURL = NativeModules.SourceCode?.scriptURL as string | undefined;
  const host = scriptURL?.match(/^[a-z]+:\/\/([^:/]+)/i)?.[1];
  return host ? `http://${host}:8080` : undefined;
};

const usesPhoneLocalhost = (url?: string) => !url || /\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(url);
const inferredApiBaseUrl = inferExpoGoApiBaseUrl();

export const SKIMP_API_BASE_URL = (
  usesPhoneLocalhost(configuredApiBaseUrl) ? inferredApiBaseUrl ?? configuredApiBaseUrl : configuredApiBaseUrl
  ?? 'http://localhost:8080'
).replace(/\/$/, '');
export const API_CURRENT_USER_ID = process.env.EXPO_PUBLIC_SKIMP_CURRENT_USER_ID ?? '00000000-0000-0000-0000-000000000001';
export const API_CURRENT_GROUP_ID = process.env.EXPO_PUBLIC_SKIMP_CURRENT_GROUP_ID ?? '00000000-0000-0000-0000-000000000100';
export const API_CURRENT_CHALLENGE_ID = process.env.EXPO_PUBLIC_SKIMP_CURRENT_CHALLENGE_ID ?? '00000000-0000-0000-0000-000000000200';

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
  const method = init?.method ?? 'GET';
  const url = `${SKIMP_API_BASE_URL}${path}`;
  const debug: ApiDebugInfo = {
    baseUrl: SKIMP_API_BASE_URL,
    path,
    url,
    method,
    platform: Platform.OS,
    configuredApiBaseUrl,
    inferredApiBaseUrl,
  };

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...init?.headers,
      },
      ...init,
    });
  } catch (error) {
    const apiError = new Error('Server Unavaliable: network request failed') as SkimpApiError;
    apiError.debug = {
      ...debug,
      causeMessage: error instanceof Error ? error.message : String(error),
    };
    throw apiError;
  }

  if (!response.ok) {
    const apiError = new Error(`Server Unavaliable: ${response.status}`) as SkimpApiError;
    apiError.debug = {
      ...debug,
      status: response.status,
      statusText: response.statusText,
    };
    throw apiError;
  }

  return response.json() as Promise<T>;
}

export const apiSkimpAdapter: SkimpDataAdapter = {
  async joinDemo(displayName) {
    const session = await request<DemoSession>('/api/demo/join', {
      method: 'POST',
      body: JSON.stringify({ displayName }),
    });

    return {
      ...session,
      userId: String(session.userId),
      groupId: String(session.groupId),
      challengeId: String(session.challengeId),
    };
  },

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
