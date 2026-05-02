/** Mock weekly recap payload — swap for API later. */
export type WeeklyStoryMock = {
  weekLabel: string;
  weekYear: string;
  currency: string;
  goalAmount: number;
  savedAmount: number;
  spentTotal: number;
  spentLastWeek: number;
  topCategory: {
    name: string;
    percentOfSpend: number;
    amount: number;
  };
  identity: {
    title: string;
    tagline: string;
    emoji: string;
  };
  leaderboard: {
    yourUserId: string;
    yourDisplayName: string;
    yourRank: number;
    friends: { rank: number; displayName: string; weeklyScore: number; isYou: boolean }[];
  };
  friendComparison: {
    friendName: string;
    metricLabel: string;
    youPercentBetter: number;
    aheadOfFriend: boolean;
  };
  streak: {
    weeksOnTrack: number;
    consistencyLabel: string;
    subtitle: string;
  };
  insight: {
    headline: string;
    body: string;
    recommendedLesson: string;
  };
  rewards: {
    pointsGainedThisWeek: number;
    totalPoints: number;
    level: number;
    levelTitle: string;
    badgesEarned: string[];
  };
  summary: {
    headline: string;
    subtext: string;
  };
};

export const weeklyStoryMock: WeeklyStoryMock = {
  weekLabel: 'May 3 – May 9',
  weekYear: '2026',
  currency: 'NZD',
  goalAmount: 200,
  savedAmount: 142.5,
  spentTotal: 286.4,
  spentLastWeek: 348.2,
  topCategory: {
    name: 'Eating out',
    percentOfSpend: 38,
    amount: 108.8,
  },
  identity: {
    title: 'Chaos Spender',
    tagline: 'The squad felt every swipe — at least you made it memorable.',
    emoji: '🔥',
  },
  /** Rank 1 = most unnecessary (“bad”) spend — hall-of-shame order. */
  leaderboard: {
    yourUserId: 'you',
    yourDisplayName: 'Connor',
    yourRank: 3,
    friends: [
      { rank: 1, displayName: 'Maya', weeklyScore: 118.2, isYou: false },
      { rank: 2, displayName: 'Alex', weeklyScore: 104.9, isYou: false },
      { rank: 3, displayName: 'Connor', weeklyScore: 82, isYou: true },
      { rank: 4, displayName: 'Taylor', weeklyScore: 76.3, isYou: false },
    ],
  },
  friendComparison: {
    friendName: 'Maya',
    metricLabel: 'unnecessary spend',
    youPercentBetter: 31,
    aheadOfFriend: true,
  },
  streak: {
    weeksOnTrack: 3,
    consistencyLabel: 'Logged spends 6 of 7 days',
    subtitle: 'Consistency beats perfection.',
  },
  insight: {
    headline: 'Your weekend splurge pattern shifted.',
    body: 'Saturday was your biggest dip — worth a light weekend guardrail.',
    recommendedLesson: 'Try the 24-hour wishlist for food delivery.',
  },
  rewards: {
    pointsGainedThisWeek: 25,
    totalPoints: 2840,
    level: 8,
    levelTitle: 'Receipt Hoarder',
    badgesEarned: ['Main character at checkout', 'Push notification victim'],
  },
  summary: {
    headline: 'You didn’t win “most restrained.”',
    subtext:
      'Maya took #1 on unnecessary spend; you’re mid-pack chaos. Cooler week next time — or we’re roasting you in slide 5 again.',
  },
};
