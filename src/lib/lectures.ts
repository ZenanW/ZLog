import { Lecture, LectureStatus, Subject } from "@/lib/types";
import { parseWeekNumber } from "@/lib/weeks";

export function filterBacklogTrackedLectures(lectures: Lecture[]): Lecture[] {
  return lectures;
}

/** Subject order (sidebar), then latest week first; untitled/non-week titles last. */
export function compareLecturesByUnitAndWeek(
  a: Lecture,
  b: Lecture,
  subjects: Subject[]
): number {
  const subjectIndex = new Map(subjects.map((s, i) => [s.id, i]));
  const ai = subjectIndex.get(a.subjectId) ?? Number.MAX_SAFE_INTEGER;
  const bi = subjectIndex.get(b.subjectId) ?? Number.MAX_SAFE_INTEGER;
  if (ai !== bi) return ai - bi;

  const aw = parseWeekNumber(a.title);
  const bw = parseWeekNumber(b.title);
  if (aw !== null && bw !== null && aw !== bw) return bw - aw;
  if (aw !== null && bw === null) return -1;
  if (aw === null && bw !== null) return 1;
  return a.title.localeCompare(b.title);
}

export function sortLecturesByUnitAndWeek(lectures: Lecture[], subjects: Subject[]): Lecture[] {
  return [...lectures].sort((a, b) => compareLecturesByUnitAndWeek(a, b, subjects));
}

export const BACKLOG_TRACKED_STATUSES: LectureStatus[] = [
  "backlog",
  "in_progress",
  "completed",
];
