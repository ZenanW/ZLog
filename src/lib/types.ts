export type LectureStatus = "backlog" | "in_progress" | "completed" | "notes_only";

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

export const PDF_KINDS = ["lecture_slides", "tutorial_sheet"] as const;

export type PdfKind = (typeof PDF_KINDS)[number];

export interface LecturePdf {
  id: string;
  lectureId: string;
  kind: PdfKind;
  name: string;
  size: number;
  summary: string | null;
  priorityRecommendation: Priority | null;
  priorityReason: string | null;
  difficulty: number | null;
  analyzedAt: string | null;
  createdAt: string;
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

export const NOTE_FORMATS = ["plain", "cornell"] as const;

export type NoteFormat = (typeof NOTE_FORMATS)[number];

export interface NoteEvaluation {
  coverageScore: number | null;
  accuracyFlags: { claim: string; issue: string; slideReference: string }[];
  missingTopics: string[];
  structureFeedback: string;
  summary: string;
}

export interface Note {
  id: string;
  lectureId: string | null;
  title: string;
  format: NoteFormat;
  content: Record<string, unknown>;
  evaluation: NoteEvaluation | null;
  evaluatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
