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

export interface Exam {
  id: string;
  name: string;
  examDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExamTopic {
  id: string;
  examId: string;
  name: string;
  revised: boolean;
  createdAt: string;
}

export interface PracticeTest {
  id: string;
  examId: string;
  title: string;
  score: number | null;
  maxScore: number | null;
  notes: string;
  takenAt: string;
  createdAt: string;
}
