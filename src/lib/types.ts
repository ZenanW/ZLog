export type LectureStatus = "backlog" | "in_progress" | "completed";

export type Priority = "low" | "medium" | "high";

export interface Subject {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Lecture {
  id: string;
  subjectId: string;
  title: string;
  notes: string;
  status: LectureStatus;
  priority: Priority;
  duration: number | null;
  lectureDate: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  subjects: Subject[];
  lectures: Lecture[];
}
