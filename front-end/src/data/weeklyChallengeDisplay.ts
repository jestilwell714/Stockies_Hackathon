import { getCurrentMemoriesWeekPointer } from './memoriesCalendar';
import { challengeRewardPoints, getDemoChallengeForChallengeId, getDemoChallengeForMemoriesWeek } from './mockDemoWeeklyChallenges';
import type { WeeklyChallenge } from './types';

function formatChallengeRange(start: string, end: string): string {
  const s = new Date(`${start}T12:00:00`);
  const e = new Date(`${end}T12:00:00`);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
    return `${start} – ${end}`;
  }
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${s.toLocaleDateString('en-NZ', opts)} – ${e.toLocaleDateString('en-NZ', opts)}`;
}

function formatCategories(categories: WeeklyChallenge['badCategorySnapshot']): string {
  return categories.map((c) => c.replace(/_/g, ' ')).join(' · ');
}

export type WeeklyChallengeHomeMetaTinted = {
  datePart: string;
  points: number;
  category: string;
};

export type WeeklyChallengeHomeDisplay = {
  title: string;
  description: string;
  /** Full sentence for accessibility and API fallback rendering. */
  metaLine: string;
  /** When set, render date / category / points with Memories-style accent colors. */
  metaTinted?: WeeklyChallengeHomeMetaTinted;
};

/**
 * Home banner: prefers the Memories calendar week that contains “today” so copy matches Memories
 * current week; otherwise falls back to the active `WeeklyChallenge` from the dashboard/API.
 */
export function getWeeklyChallengeHomeDisplay(challenge: WeeklyChallenge): WeeklyChallengeHomeDisplay {
  const pointer = getCurrentMemoriesWeekPointer();
  if (pointer) {
    const demo = getDemoChallengeForMemoriesWeek(pointer.monthIndex, pointer.weekIndex);
    const pts = challengeRewardPoints(demo.difficulty);
    const datePart = `${pointer.week.rangeLabel} (${pointer.yearLabel})`;
    return {
      title: demo.title,
      description: demo.description,
      metaLine: `${datePart} · +${pts} points · ${demo.category}`,
      metaTinted: {
        datePart,
        points: pts,
        category: demo.category,
      },
    };
  }

  const range = formatChallengeRange(challenge.startDate, challenge.endDate);
  const demo = getDemoChallengeForChallengeId(challenge.id);
  if (demo) {
    const pts = challengeRewardPoints(demo.difficulty);
    return {
      title: demo.title,
      description: demo.description,
      metaLine: `${range} · +${pts} points · ${demo.category}`,
      metaTinted: {
        datePart: range,
        points: pts,
        category: demo.category,
      },
    };
  }
  return {
    title: 'Weekly challenge',
    description: `Stay aware of group-flagged spend for the week of ${range}.`,
    metaLine: formatCategories(challenge.badCategorySnapshot),
  };
}
