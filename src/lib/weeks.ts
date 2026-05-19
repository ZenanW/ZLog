export const WEEK_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export function formatWeekTitle(week: number): string {
  return `Week ${week}`;
}

const WEEK_RE = /^week\s*(\d+)$/i;

export function parseWeekNumber(title: string): number | null {
  const m = title.trim().match(WEEK_RE);
  return m ? parseInt(m[1], 10) : null;
}
