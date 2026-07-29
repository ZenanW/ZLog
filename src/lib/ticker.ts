/** Shown when there are no lectures yet. */
export const TICKER_FILLERS = [
  "You can relax right now — semester hasn't started yet ☕",
  "No backlog. Suspiciously calm.",
  "Add a subject and pretend you're organised.",
  "Zero lectures. Peak productivity, technically.",
  "The kanban board is taking a mental health day.",
  "Nothing to track yet. Enjoy it while it lasts.",
  "Your future self will hate this empty backlog. For now, chill.",
  "Semester loading… please stand by.",
  "No PDFs, no panic, no problem.",
  "This is the calm before the Week 1 slides drop.",
  "Backlog Track is idle. So are you. Fair.",
  "Add a lecture when reality kicks in.",
] as const;

/** Extra context lines so the strip stays full without repeating action items. */
export const TICKER_TIPS = [
  "Tip: upload slides, then hit Analyze for an AI summary and difficulty score",
  "Tip: mark high-priority weeks first so they surface in the ticker",
  "Tip: move a lecture to In Progress when you start reviewing it",
  "Tip: add exams to see countdowns here",
  "Tip: tutorial sheets work too — not just lecture slides",
] as const;

export function pickRandomFillers(count: number): string[] {
  const pool = [...TICKER_FILLERS];
  const picked: string[] = [];
  while (picked.length < count && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(i, 1)[0]);
  }
  return picked;
}

/** Seconds for one full marquee loop; higher = slower. */
export function tickerScrollDuration(segmentCount: number): number {
  if (segmentCount <= 4) return 90;
  if (segmentCount <= 6) return 75;
  if (segmentCount <= 8) return 65;
  return 55;
}

export const TICKER_MIN_SEGMENTS = 8;
