import { memoriesWeekFlatIndex, MEMORIES_MONTHS } from './memoriesCalendar';

export type DemoWeeklyChallengeSpec = {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  xp: number;
};

/** One demo challenge per week in `MEMORIES_MONTHS` (20 weeks). */
export const DEMO_WEEKLY_CHALLENGES: DemoWeeklyChallengeSpec[] = [
  {
    id: 1,
    title: 'No-spend weekend',
    description: 'Avoid all non-essential spending from Friday evening to Sunday night.',
    category: 'challenge',
    difficulty: 2,
    xp: 500,
  },
  {
    id: 2,
    title: 'Cancel one subscription',
    description: 'Review your recurring charges and cancel at least one you no longer use.',
    category: 'tracking',
    difficulty: 1,
    xp: 300,
  },
  {
    id: 3,
    title: 'Pack lunch every day',
    description: 'Bring food from home instead of buying lunch for the full work week.',
    category: 'savings',
    difficulty: 2,
    xp: 400,
  },
  {
    id: 4,
    title: 'Log every purchase',
    description: 'Record every single transaction you make this week, no matter how small.',
    category: 'tracking',
    difficulty: 1,
    xp: 250,
  },
  {
    id: 5,
    title: 'Save $20 this week',
    description: 'Transfer at least $20 into your savings account before the week ends.',
    category: 'savings',
    difficulty: 1,
    xp: 300,
  },
  {
    id: 6,
    title: 'Cook all meals at home',
    description: 'Avoid restaurants, takeaways and food delivery apps for 7 days straight.',
    category: 'challenge',
    difficulty: 3,
    xp: 600,
  },
  {
    id: 7,
    title: 'Set a weekly spending limit',
    description: 'Decide on a realistic discretionary budget for the week and stick to it.',
    category: 'tracking',
    difficulty: 2,
    xp: 350,
  },
  {
    id: 8,
    title: 'Skip your daily coffee shop',
    description: 'Make coffee at home every morning this week instead of buying it out.',
    category: 'challenge',
    difficulty: 2,
    xp: 350,
  },
  {
    id: 9,
    title: "Sell something you don't use",
    description: 'List one unused item online and put whatever you earn straight into savings.',
    category: 'savings',
    difficulty: 2,
    xp: 450,
  },
  {
    id: 10,
    title: 'Write down your savings goal',
    description: 'Define one specific financial goal with a target amount and deadline.',
    category: 'mindset',
    difficulty: 1,
    xp: 200,
  },
  {
    id: 11,
    title: 'Use cash only for 3 days',
    description: 'Leave your card at home and only spend the physical cash you take out.',
    category: 'challenge',
    difficulty: 3,
    xp: 550,
  },
  {
    id: 12,
    title: 'Check your bank balance daily',
    description: 'Open your banking app every morning and note your balance before spending anything.',
    category: 'mindset',
    difficulty: 1,
    xp: 200,
  },
  {
    id: 13,
    title: "Eat what's already in your fridge",
    description: 'Plan your meals around what you already have before buying any groceries.',
    category: 'savings',
    difficulty: 2,
    xp: 400,
  },
  {
    id: 14,
    title: 'Invite a friend to save with you',
    description: 'Get a friend or family member to take on the same challenge alongside you this week.',
    category: 'social',
    difficulty: 1,
    xp: 300,
  },
  {
    id: 15,
    title: 'Find a cheaper alternative',
    description: 'Pick one regular expense (coffee, gym, streaming) and find a cheaper or free substitute.',
    category: 'savings',
    difficulty: 2,
    xp: 400,
  },
  {
    id: 16,
    title: "Review last month's spending",
    description: "Look back at your transactions from last month and identify your biggest unnecessary expense.",
    category: 'tracking',
    difficulty: 1,
    xp: 250,
  },
  {
    id: 17,
    title: 'Round up every purchase',
    description: 'Manually round up each purchase to the nearest dollar and move the difference to savings.',
    category: 'savings',
    difficulty: 1,
    xp: 300,
  },
  {
    id: 18,
    title: 'Wait 48 hours before buying',
    description: 'Any non-essential item you want to buy this week must wait 48 hours before you purchase it.',
    category: 'mindset',
    difficulty: 2,
    xp: 400,
  },
  {
    id: 19,
    title: 'Share your progress',
    description: "Post your savings total or a challenge update in the app's community feed this week.",
    category: 'social',
    difficulty: 1,
    xp: 250,
  },
  {
    id: 20,
    title: 'Put your spare change aside',
    description: 'At the end of each day, set aside any coins or leftover small amounts into a savings jar or account.',
    category: 'savings',
    difficulty: 1,
    xp: 200,
  },
];

const expectedWeeks = MEMORIES_MONTHS.reduce((n, m) => n + m.weeks.length, 0);
if (DEMO_WEEKLY_CHALLENGES.length !== expectedWeeks) {
  throw new Error(
    `DEMO_WEEKLY_CHALLENGES length ${DEMO_WEEKLY_CHALLENGES.length} !== calendar weeks ${expectedWeeks}`,
  );
}

/** Demo-only pass/fail for the signed-in viewer when no recap exists for that week. */
export const DEMO_VIEWER_WEEK_PASSED: boolean[] = [
  true, false, true, true, false, true, false, true, true, false, true, true, false, true, false, true, true,
  false, true, false,
];

if (DEMO_VIEWER_WEEK_PASSED.length !== DEMO_WEEKLY_CHALLENGES.length) {
  throw new Error(
    `DEMO_VIEWER_WEEK_PASSED length ${DEMO_VIEWER_WEEK_PASSED.length} !== challenges ${DEMO_WEEKLY_CHALLENGES.length}`,
  );
}

export function getDemoViewerWeekPassed(flatIndex: number): boolean {
  return DEMO_VIEWER_WEEK_PASSED[flatIndex] ?? false;
}

export function getDemoChallengeForMemoriesWeek(monthIndex: number, weekIndex: number): DemoWeeklyChallengeSpec {
  const flat = memoriesWeekFlatIndex(monthIndex, weekIndex);
  const row = DEMO_WEEKLY_CHALLENGES[flat];
  if (!row) {
    throw new Error(`No demo challenge for month ${monthIndex} week ${weekIndex}`);
  }
  return row;
}

/** `challenge-w00` … from mock seed */
export function getDemoChallengeForChallengeId(challengeId: string): DemoWeeklyChallengeSpec | undefined {
  const m = /^challenge-w(\d{2})$/.exec(challengeId);
  if (!m) return undefined;
  const flat = Number.parseInt(m[1], 10);
  return DEMO_WEEKLY_CHALLENGES[flat];
}

export function mockChallengeIdForFlatIndex(flat: number): string {
  return `challenge-w${String(flat).padStart(2, '0')}`;
}

/** Demo “today” is first day of May week 1 (May 3–9): aligns with hackathon Memories grid. */
export const MOCK_ACTIVE_WEEK_FLAT_INDEX = memoriesWeekFlatIndex(
  MEMORIES_MONTHS.length - 1,
  0,
);

export const MOCK_ACTIVE_CHALLENGE_ID = mockChallengeIdForFlatIndex(MOCK_ACTIVE_WEEK_FLAT_INDEX);
