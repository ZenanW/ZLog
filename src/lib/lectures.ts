import { Lecture, LectureStatus } from "@/lib/types";

/** Lectures tracked on the Lectures tab (kanban, stats, ticker). */
export function isBacklogTrackedLecture(lecture: Lecture): boolean {
  return lecture.status !== "notes_only";
}

export function filterBacklogTrackedLectures(lectures: Lecture[]): Lecture[] {
  return lectures.filter(isBacklogTrackedLecture);
}

export function isNotesCaptureLecture(lecture: Lecture): boolean {
  return lecture.status === "notes_only";
}

export const BACKLOG_TRACKED_STATUSES: LectureStatus[] = [
  "backlog",
  "in_progress",
  "completed",
];
