/** Shared demo calendar for Memories + mock weekly challenges (must stay in sync). */

export const DEMO_YEAR = 2026;

export type MonthWeek = {
  rangeLabel: string;
  /** Inclusive start (local calendar day). */
  start: Date;
  /** Inclusive end (local calendar day). */
  end: Date;
};

export type MonthDef = {
  label: string;
  fullLabel: string;
  year: string;
  weeks: MonthWeek[];
};

export const MEMORIES_MONTHS: MonthDef[] = [
  {
    label: 'Jan',
    fullLabel: 'January 2026',
    year: '2026',
    weeks: [
      { rangeLabel: 'Jan 4 - Jan 10', start: new Date(DEMO_YEAR, 0, 4), end: new Date(DEMO_YEAR, 0, 10) },
      { rangeLabel: 'Jan 11 - Jan 17', start: new Date(DEMO_YEAR, 0, 11), end: new Date(DEMO_YEAR, 0, 17) },
      { rangeLabel: 'Jan 18 - Jan 24', start: new Date(DEMO_YEAR, 0, 18), end: new Date(DEMO_YEAR, 0, 24) },
      { rangeLabel: 'Jan 25 - Jan 31', start: new Date(DEMO_YEAR, 0, 25), end: new Date(DEMO_YEAR, 0, 31) },
    ],
  },
  {
    label: 'Feb',
    fullLabel: 'February 2026',
    year: '2026',
    weeks: [
      { rangeLabel: 'Feb 1 - Feb 7', start: new Date(DEMO_YEAR, 1, 1), end: new Date(DEMO_YEAR, 1, 7) },
      { rangeLabel: 'Feb 8 - Feb 14', start: new Date(DEMO_YEAR, 1, 8), end: new Date(DEMO_YEAR, 1, 14) },
      { rangeLabel: 'Feb 15 - Feb 21', start: new Date(DEMO_YEAR, 1, 15), end: new Date(DEMO_YEAR, 1, 21) },
      { rangeLabel: 'Feb 22 - Feb 28', start: new Date(DEMO_YEAR, 1, 22), end: new Date(DEMO_YEAR, 1, 28) },
    ],
  },
  {
    label: 'Mar',
    fullLabel: 'March 2026',
    year: '2026',
    weeks: [
      { rangeLabel: 'Mar 1 - Mar 7', start: new Date(DEMO_YEAR, 2, 1), end: new Date(DEMO_YEAR, 2, 7) },
      { rangeLabel: 'Mar 8 - Mar 14', start: new Date(DEMO_YEAR, 2, 8), end: new Date(DEMO_YEAR, 2, 14) },
      { rangeLabel: 'Mar 15 - Mar 21', start: new Date(DEMO_YEAR, 2, 15), end: new Date(DEMO_YEAR, 2, 21) },
      { rangeLabel: 'Mar 22 - Mar 28', start: new Date(DEMO_YEAR, 2, 22), end: new Date(DEMO_YEAR, 2, 28) },
    ],
  },
  {
    label: 'Apr',
    fullLabel: 'April 2026',
    year: '2026',
    weeks: [
      { rangeLabel: 'Apr 5 - Apr 11', start: new Date(DEMO_YEAR, 3, 5), end: new Date(DEMO_YEAR, 3, 11) },
      { rangeLabel: 'Apr 12 - Apr 18', start: new Date(DEMO_YEAR, 3, 12), end: new Date(DEMO_YEAR, 3, 18) },
      { rangeLabel: 'Apr 19 - Apr 25', start: new Date(DEMO_YEAR, 3, 19), end: new Date(DEMO_YEAR, 3, 25) },
      { rangeLabel: 'Apr 26 - May 2', start: new Date(DEMO_YEAR, 3, 26), end: new Date(DEMO_YEAR, 4, 2) },
    ],
  },
  {
    label: 'May',
    fullLabel: 'May 2026',
    year: '2026',
    weeks: [
      { rangeLabel: 'May 3 - May 9', start: new Date(DEMO_YEAR, 4, 3), end: new Date(DEMO_YEAR, 4, 9) },
      { rangeLabel: 'May 10 - May 16', start: new Date(DEMO_YEAR, 4, 10), end: new Date(DEMO_YEAR, 4, 16) },
      { rangeLabel: 'May 17 - May 23', start: new Date(DEMO_YEAR, 4, 17), end: new Date(DEMO_YEAR, 4, 23) },
      { rangeLabel: 'May 24 - May 30', start: new Date(DEMO_YEAR, 4, 24), end: new Date(DEMO_YEAR, 4, 30) },
    ],
  },
];

export const MEMORIES_WEEKS_PER_MONTH = 4;

/** Zero-based flat index Jan week1 = 0 … May week4 = 19. */
export function memoriesWeekFlatIndex(monthIndex: number, weekIndex: number): number {
  return monthIndex * MEMORIES_WEEKS_PER_MONTH + weekIndex;
}

export function toLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Calendar week containing `now` in the demo grid (Memories), if any. */
export function getCurrentMemoriesWeekPointer(
  now: Date = new Date(),
): { monthIndex: number; weekIndex: number; week: MonthWeek; yearLabel: string } | null {
  for (let mi = 0; mi < MEMORIES_MONTHS.length; mi++) {
    const month = MEMORIES_MONTHS[mi];
    for (let wi = 0; wi < month.weeks.length; wi++) {
      const week = month.weeks[wi];
      const day = startOfDay(now).getTime();
      const start = startOfDay(week.start).getTime();
      const end = startOfDay(week.end).getTime();
      if (day >= start && day <= end) {
        return { monthIndex: mi, weekIndex: wi, week, yearLabel: month.year };
      }
    }
  }
  return null;
}
