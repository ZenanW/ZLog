import { Assignment, Exam, Lecture, Subject } from "@/lib/types";

const WINDOW_DAYS = 14;
const MAX_ITEMS = 5;

export type TodayKind = "assignment" | "exam" | "lecture";

export interface TodayItem {
  kind: TodayKind;
  id: string;
  subjectName: string;
  subjectColor: string | null;
  title: string;
  reason: string;
  urgent: boolean;
}

function daysUntil(dateStr: string, now: Date): number {
  return Math.ceil((new Date(dateStr).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function subjectOf(subjects: Subject[], subjectId: string | null): Subject | undefined {
  if (!subjectId) return undefined;
  return subjects.find((subject) => subject.id === subjectId);
}

function dueReason(days: number): string {
  if (days < 0) {
    const n = Math.abs(days);
    return n === 1 ? "Due yesterday" : `Due ${n} days ago`;
  }
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

function examReason(days: number): string {
  if (days === 0) return "Exam today";
  if (days === 1) return "Exam tomorrow";
  return `Exam in ${days} days`;
}

function pickLecture(lectures: Lecture[]): { lecture: Lecture; reason: string } | null {
  const byOldestUpdate = (a: Lecture, b: Lecture) => a.updatedAt.localeCompare(b.updatedAt);
  const inProgress = lectures.filter((lecture) => lecture.status === "in_progress").sort(byOldestUpdate);
  if (inProgress[0]) return { lecture: inProgress[0], reason: "Still in progress" };
  const highBacklog = lectures
    .filter((lecture) => lecture.status === "backlog" && lecture.priority === "high")
    .sort(byOldestUpdate);
  if (highBacklog[0]) return { lecture: highBacklog[0], reason: "High priority, not started" };
  return null;
}

export function buildTodayItems(input: {
  assignments: Assignment[];
  exams: Exam[];
  lectures: Lecture[];
  subjects: Subject[];
  now?: Date;
}): TodayItem[] {
  const now = input.now ?? new Date();
  const dated: { days: number; item: TodayItem }[] = [];

  for (const assignment of input.assignments) {
    if (assignment.status === "submitted" || !assignment.dueDate) continue;
    const days = daysUntil(assignment.dueDate, now);
    if (days > WINDOW_DAYS) continue;
    const subject = subjectOf(input.subjects, assignment.subjectId);
    dated.push({
      days,
      item: {
        kind: "assignment",
        id: assignment.id,
        subjectName: subject?.name ?? "No subject",
        subjectColor: subject?.color ?? null,
        title: assignment.name,
        reason: dueReason(days),
        urgent: days <= 1,
      },
    });
  }

  for (const exam of input.exams) {
    if (!exam.examDate) continue;
    const days = daysUntil(exam.examDate, now);
    if (days < 0 || days > WINDOW_DAYS) continue;
    const subject = subjectOf(input.subjects, exam.subjectId);
    dated.push({
      days,
      item: {
        kind: "exam",
        id: exam.id,
        subjectName: subject?.name ?? "No subject",
        subjectColor: subject?.color ?? null,
        title: exam.name,
        reason: examReason(days),
        urgent: days <= 1,
      },
    });
  }

  dated.sort((a, b) => a.days - b.days || a.item.title.localeCompare(b.item.title));

  const pickedLecture = pickLecture(input.lectures);
  const room = pickedLecture ? MAX_ITEMS - 1 : MAX_ITEMS;
  const items = dated.slice(0, room).map((entry) => entry.item);

  if (pickedLecture) {
    const subject = subjectOf(input.subjects, pickedLecture.lecture.subjectId);
    items.push({
      kind: "lecture",
      id: pickedLecture.lecture.id,
      subjectName: subject?.name ?? "No subject",
      subjectColor: subject?.color ?? null,
      title: pickedLecture.lecture.title,
      reason: pickedLecture.reason,
      urgent: false,
    });
  }

  return items;
}
