import { PracticeChoice, PracticeQuestion, PracticeQuestionKind, PracticeSet } from "@/lib/types";

export const PRACTICE_MCQ_COUNT = 6;
export const PRACTICE_SHORT_COUNT = 3;
export const PRACTICE_MCQ_CHOICES = 4;

export const PRACTICE_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "kind",
          "prompt",
          "choices",
          "correct_choice_id",
          "model_answer",
          "explanation",
          "slide_reference",
        ],
        properties: {
          kind: { type: "string", enum: ["mcq", "short"] },
          prompt: { type: "string" },
          choices: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["id", "text"],
              properties: {
                id: { type: "string" },
                text: { type: "string" },
              },
            },
          },
          correct_choice_id: { type: "string" },
          model_answer: { type: "string" },
          explanation: { type: "string" },
          slide_reference: { type: "string" },
        },
      },
    },
  },
} as const;

export interface GeneratedQuestionDraft {
  kind: PracticeQuestionKind;
  prompt: string;
  choices: PracticeChoice[] | null;
  correctChoiceId: string | null;
  modelAnswer: string | null;
  explanation: string;
  slideReference: string | null;
}

export function mapPracticeQuestionFromDb(row: Record<string, unknown>): PracticeQuestion {
  return {
    id: row.id as string,
    setId: row.set_id as string,
    sortOrder: row.sort_order as number,
    kind: row.kind as PracticeQuestionKind,
    prompt: row.prompt as string,
    choices: (row.choices as PracticeChoice[] | null) ?? null,
    correctChoiceId: (row.correct_choice_id as string) ?? null,
    modelAnswer: (row.model_answer as string) ?? null,
    explanation: row.explanation as string,
    slideReference: (row.slide_reference as string) ?? null,
  };
}

export function mapPracticeSetFromDb(row: Record<string, unknown>): PracticeSet {
  const rawQuestions = (row.practice_questions as Record<string, unknown>[] | undefined) ?? [];
  return {
    id: row.id as string,
    lectureId: row.lecture_id as string,
    generatedAt: row.generated_at as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    questions: rawQuestions
      .map(mapPracticeQuestionFromDb)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export const PRACTICE_SET_SIZE = PRACTICE_MCQ_COUNT + PRACTICE_SHORT_COUNT;

function asNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function normalizeGeneratedQuestion(item: unknown): GeneratedQuestionDraft | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  const kind = row.kind === "mcq" || row.kind === "short" ? row.kind : null;
  const prompt = asNonEmptyString(row.prompt);
  const explanation = asNonEmptyString(row.explanation);
  if (!kind || !prompt || !explanation) return null;

  if (kind === "mcq") {
    if (!Array.isArray(row.choices) || row.choices.length !== PRACTICE_MCQ_CHOICES) return null;
    const choices: PracticeChoice[] = [];
    const seen = new Set<string>();
    for (const choice of row.choices) {
      if (!choice || typeof choice !== "object") return null;
      const id = asNonEmptyString((choice as { id?: unknown }).id);
      const text = asNonEmptyString((choice as { text?: unknown }).text);
      if (!id || !text || seen.has(id)) return null;
      seen.add(id);
      choices.push({ id, text });
    }
    const correctChoiceId = asNonEmptyString(row.correct_choice_id);
    if (!correctChoiceId || !seen.has(correctChoiceId)) return null;
    return {
      kind,
      prompt,
      choices,
      correctChoiceId,
      modelAnswer: null,
      explanation,
      slideReference: asNonEmptyString(row.slide_reference),
    };
  }

  const modelAnswer = asNonEmptyString(row.model_answer);
  if (!modelAnswer) return null;
  return {
    kind,
    prompt,
    choices: null,
    correctChoiceId: null,
    modelAnswer,
    explanation,
    slideReference: asNonEmptyString(row.slide_reference),
  };
}

export function normalizeGeneratedQuestions(raw: unknown): GeneratedQuestionDraft[] | null {
  if (!raw || typeof raw !== "object") return null;
  const questions = (raw as { questions?: unknown }).questions;
  if (!Array.isArray(questions) || questions.length !== PRACTICE_SET_SIZE) return null;
  const drafts: GeneratedQuestionDraft[] = [];
  for (const item of questions) {
    const draft = normalizeGeneratedQuestion(item);
    if (!draft) return null;
    drafts.push(draft);
  }
  const mcqCount = drafts.filter((q) => q.kind === "mcq").length;
  const shortCount = drafts.filter((q) => q.kind === "short").length;
  if (mcqCount !== PRACTICE_MCQ_COUNT || shortCount !== PRACTICE_SHORT_COUNT) return null;
  return drafts;
}

function findQuestionsArrayStart(text: string): number {
  const key = text.indexOf('"questions"');
  if (key < 0) return -1;
  const colon = text.indexOf(":", key + 10);
  if (colon < 0) return -1;
  const bracket = text.indexOf("[", colon + 1);
  return bracket < 0 ? -1 : bracket + 1;
}

function matchJsonObjectEnd(text: string, start: number): number {
  if (text[start] !== "{") return -1;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === "\"") inString = false;
      continue;
    }
    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Pull finished question objects from a growing structured-output JSON prefix. */
export function extractQuestionObjects(jsonSoFar: string): unknown[] {
  const start = findQuestionsArrayStart(jsonSoFar);
  if (start < 0) return [];
  const objects: unknown[] = [];
  let i = start;
  while (i < jsonSoFar.length) {
    while (i < jsonSoFar.length && /[\s,]/.test(jsonSoFar[i])) i += 1;
    if (i >= jsonSoFar.length || jsonSoFar[i] === "]") break;
    if (jsonSoFar[i] !== "{") break;
    const end = matchJsonObjectEnd(jsonSoFar, i);
    if (end < 0) break;
    try {
      objects.push(JSON.parse(jsonSoFar.slice(i, end + 1)));
    } catch {
      break;
    }
    i = end + 1;
  }
  return objects;
}

export function missingPracticeTablesMessage(message: string): string | null {
  if (/practice_sets|practice_questions/.test(message) && /schema cache|does not exist/i.test(message)) {
    return "Database is missing practice tables — run scripts/migrations/007_practice_questions.sql in the Supabase SQL editor.";
  }
  return null;
}
