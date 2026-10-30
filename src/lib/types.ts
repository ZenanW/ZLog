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

export const PDF_KINDS = [
  "lecture_slides",
  "tutorial_sheet",
  "tutorial_answers",
  "lecture_transcript",
] as const;

export type PdfKind = (typeof PDF_KINDS)[number];

export const PDF_KIND_LABELS: Record<PdfKind, string> = {
  lecture_slides: "Slides",
  tutorial_sheet: "Tutorial",
  tutorial_answers: "Answers",
  lecture_transcript: "Transcript",
};

export function isPdfDocumentKind(kind: PdfKind): boolean {
  return kind !== "lecture_transcript";
}

export const MAX_PDF_SIZE = 20 * 1024 * 1024;
export const MAX_TRANSCRIPT_SIZE = 5 * 1024 * 1024;

export function maxSizeForKind(kind: PdfKind): number {
  return isPdfDocumentKind(kind) ? MAX_PDF_SIZE : MAX_TRANSCRIPT_SIZE;
}

export function contentTypeForKind(kind: PdfKind): string {
  return isPdfDocumentKind(kind) ? "application/pdf" : "text/plain";
}

export function acceptForKind(kind: PdfKind): string {
  return isPdfDocumentKind(kind) ? "application/pdf,.pdf" : ".txt,text/plain";
}

export function kindFileError(kind: PdfKind): string {
  return isPdfDocumentKind(kind)
    ? "File must be a PDF."
    : "Transcripts must be a .txt file.";
}

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
  subjectId: string | null;
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

export const ASSIGNMENT_STATUSES = ["not_started", "in_progress", "submitted"] as const;

export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  submitted: "Submitted",
};

export function isAssignmentStatus(value: unknown): value is AssignmentStatus {
  return typeof value === "string" && (ASSIGNMENT_STATUSES as readonly string[]).includes(value);
}

export interface Assignment {
  id: string;
  subjectId: string;
  name: string;
  dueDate: string | null;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
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

export const PRACTICE_QUESTION_KINDS = ["mcq", "short"] as const;

export type PracticeQuestionKind = (typeof PRACTICE_QUESTION_KINDS)[number];

export interface PracticeChoice {
  id: string;
  text: string;
}

export interface PracticeQuestion {
  id: string;
  setId: string;
  sortOrder: number;
  kind: PracticeQuestionKind;
  prompt: string;
  choices: PracticeChoice[] | null;
  correctChoiceId: string | null;
  modelAnswer: string | null;
  explanation: string;
  slideReference: string | null;
}

export interface PracticeSet {
  id: string;
  lectureId: string;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
  questions: PracticeQuestion[];
}
