export type SpendingCategory =
  | 'eating_out'
  | 'groceries'
  | 'clothing'
  | 'transport'
  | 'rent'
  | 'subscriptions'
  | 'entertainment'
  | 'other';

export type CategoryMethod = 'seed' | 'cache' | 'llm' | 'user' | 'manual';
export type Medal = 'gold' | 'silver' | 'bronze';
export type GroupRole = 'creator' | 'member';

export type Profile = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  avatarColor: string;
  totalPoints: number;
};

export type FriendGroup = {
  id: string;
  groupName: string;
  inviteCode: string;
  creatorUserId: string;
  badCategories: SpendingCategory[];
  active: boolean;
};

export type GroupMember = {
  groupId: string;
  userId: string;
  role: GroupRole;
  joinedAt: string;
  leftAt?: string;
};

export type WeeklyChallenge = {
  id: string;
  groupId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  badCategorySnapshot: SpendingCategory[];
};

export type Transaction = {
  id: string;
  userId: string;
  groupId: string;
  challengeId: string;
  amount: number;
  currency: string;
  description: string;
  merchant: string;
  timestamp: string;
  category?: SpendingCategory;
  categoryMethod?: CategoryMethod;
  categorizedAt?: string;
  isBadSpend: boolean;
  needsReview: boolean;
  sourceTransactionId: string;
  rawPayload?: Record<string, unknown>;
};

export type LeaderboardRow = {
  userId: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  avatarColor: string;
  weeklyBadSpend: number;
  rank: number;
  medal?: Medal;
  trend: 'up' | 'down' | 'flat';
};

export type PointsLeaderboardRow = {
  userId: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  avatarColor: string;
  totalPoints: number;
  rank: number;
  medal?: Medal;
};

export type GraphPoint = {
  day: string;
  dayIndex: number;
  date: string;
  cumulativeAmount: number;
};

export type CumulativeSpendSeries = {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  avatarColor: string;
  points: GraphPoint[];
};

export type WeeklyGraph = {
  days: string[];
  series: CumulativeSpendSeries[];
};

export type ActivityFeedItem = {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  avatarColor: string;
  merchant: string;
  amount: number;
  category?: SpendingCategory;
  timestamp: string;
  tone: 'celebration' | 'nudge' | 'neutral';
};

export type ProfileSummary = {
  profile: Profile;
  medals: Record<Medal, number>;
  weeklySpend: number;
  averageDailySpend: number;
  currentRank: number;
  recentTransactions: Transaction[];
};

export type DailyBreakdown = {
  day: string;
  amount: number;
};

export type WeeklyRecap = {
  id: string;
  groupId: string;
  challengeId: string;
  weekLabel: string;
  startDate: string;
  endDate: string;
  finalLeaderboard: LeaderboardRow[];
  graph: WeeklyGraph;
  dailyBreakdown: DailyBreakdown[];
  highlights: string[];
  keyStats: {
    totalBadSpend: number;
    winnerName: string;
    cleanestDay: string;
    biggestDrop: string;
  };
};

export type HomeDashboard = {
  profile: Profile;
  group: FriendGroup;
  challenge: WeeklyChallenge;
  leaderboard: LeaderboardRow[];
  graph: WeeklyGraph;
  activityFeed: ActivityFeedItem[];
};

export type DemoSession = {
  userId: string;
  username: string;
  displayName: string;
  groupId: string;
  groupName: string;
  inviteCode: string;
  challengeId: string;
};

export type ApiDebugInfo = {
  baseUrl: string;
  path: string;
  url: string;
  method: string;
  platform: string;
  configuredApiBaseUrl?: string;
  inferredApiBaseUrl?: string;
};

export type SkimpApiError = Error & {
  debug?: ApiDebugInfo & {
    status?: number;
    statusText?: string;
    causeMessage?: string;
  };
};

export type MerchantCacheEntry = {
  category: SpendingCategory;
  method: CategoryMethod;
};

export type ClassifierResult = {
  category: SpendingCategory;
  method: CategoryMethod;
  needsReview: boolean;
};

export type SkimpDataAdapter = {
  joinDemo(displayName: string): Promise<DemoSession>;
  getHomeDashboard(userId: string): Promise<HomeDashboard>;
  getWeeklyLeaderboard(groupId: string, challengeId: string): Promise<LeaderboardRow[]>;
  getPointsLeaderboard(groupId: string): Promise<PointsLeaderboardRow[]>;
  getWeeklyCumulativeSpend(groupId: string, challengeId: string): Promise<WeeklyGraph>;
  getActivityFeed(groupId: string, limit?: number): Promise<ActivityFeedItem[]>;
  simulateTransaction(input: {
    userId: string;
    amount: number;
    description: string;
    timestamp?: string;
  }): Promise<Transaction>;
  getProfileSummary(
    userId: string,
    groupId: string,
    challengeId: string,
  ): Promise<ProfileSummary>;
  getUserTransactions(userId: string, limit?: number): Promise<Transaction[]>;
  getWeeklyRecaps(groupId: string): Promise<WeeklyRecap[]>;
  getWeeklyRecap(groupId: string, challengeId: string): Promise<WeeklyRecap>;
};
