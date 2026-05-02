import { toLocalYmd, type MonthWeek } from './memoriesCalendar';
import { getDemoViewerWeekPassed } from './mockDemoWeeklyChallenges';
import type { WeeklyRecap } from './types';

export function recapKey(startDate: string, endDate: string): string {
  return `${startDate}|${endDate}`;
}

export function buildRecapByWeekKey(recaps: WeeklyRecap[]): Map<string, WeeklyRecap> {
  const map = new Map<string, WeeklyRecap>();
  for (const recap of recaps) {
    map.set(recapKey(recap.startDate, recap.endDate), recap);
  }
  return map;
}

export function getViewerWeekOutcome({
  weekRelation,
  currentUserId,
  recapForWeek,
  flatWeekIndex,
}: {
  weekRelation: 'past' | 'current' | 'future';
  currentUserId: string;
  recapForWeek: WeeklyRecap | undefined;
  flatWeekIndex: number;
}): 'pass' | 'fail' | null {
  if (weekRelation !== 'past') return null;

  if (recapForWeek) {
    const row = recapForWeek.finalLeaderboard.find((u) => u.userId === currentUserId);
    if (row) {
      return row.medal ? 'pass' : 'fail';
    }
  }

  return getDemoViewerWeekPassed(flatWeekIndex) ? 'pass' : 'fail';
}

export function getRecapForCalendarWeek(
  recapByWeekKey: Map<string, WeeklyRecap>,
  week: MonthWeek,
): WeeklyRecap | undefined {
  return recapByWeekKey.get(recapKey(toLocalYmd(week.start), toLocalYmd(week.end)));
}
