import { PracticeChoice, PracticeQuestion, PracticeQuestionKind, PracticeSet } from "@/lib/types";

export const PRACTICE_MCQ_COUNT = 10;
export const PRACTICE_SHORT_COUNT = 5;
export const PRACTICE_MCQ_CHOICES = 4;

export type PracticeGenerateMode = "mcq" | "short";

export function practiceCountFor(mode: PracticeGenerateMode): number {
  return mode === "mcq" ? PRACTICE_MCQ_COUNT : PRACTICE_SHORT_COUNT;
}

const CHOICE_IDS = ["a", "b", "c", "d"] as const;

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

function asNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function canonicalChoiceId(value: unknown): string | null {
  const text = asNonEmptyString(value);
  if (!text) return null;
  const id = text.toLowerCase();
  return (CHOICE_IDS as readonly string[]).includes(id) ? id : null;
}

function choicesFromUnknown(raw: unknown): PracticeChoice[] | null {
  if (Array.isArray(raw)) {
    if (raw.length !== PRACTICE_MCQ_CHOICES) return null;
    const byId = new Map<string, string>();
    for (const choice of raw) {
      if (!choice || typeof choice !== "object") return null;
      const id = canonicalChoiceId((choice as { id?: unknown }).id);
      const text = asNonEmptyString((choice as { text?: unknown }).text);
      if (!id || !text || byId.has(id)) return null;
      byId.set(id, text);
    }
    if (byId.size !== PRACTICE_MCQ_CHOICES) return null;
    return CHOICE_IDS.map((id) => ({ id, text: byId.get(id)! }));
  }
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const choices: PracticeChoice[] = [];
  for (const id of CHOICE_IDS) {
    const text = asNonEmptyString(record[id] ?? record[id.toUpperCase()]);
    if (!text) return null;
    choices.push({ id, text });
  }
  return choices;
}

export function normalizeGeneratedQuestion(item: unknown): GeneratedQuestionDraft | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  const kind = row.kind === "mcq" || row.kind === "short" ? row.kind : null;
  const prompt = asNonEmptyString(row.prompt);
  const explanation = asNonEmptyString(row.explanation);
  if (!kind || !prompt || !explanation) return null;

  if (kind === "mcq") {
    const choices = choicesFromUnknown(row.choices);
    const correctChoiceId = canonicalChoiceId(row.correct_choice_id);
    if (!choices || !correctChoiceId) return null;
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

export function normalizeGeneratedQuestions(
  raw: unknown,
  mode: PracticeGenerateMode
): GeneratedQuestionDraft[] | null {
  if (!raw || typeof raw !== "object") return null;
  const questions = (raw as { questions?: unknown }).questions;
  const expected = practiceCountFor(mode);
  if (!Array.isArray(questions) || questions.length !== expected) return null;
  const drafts: GeneratedQuestionDraft[] = [];
  for (const item of questions) {
    const draft = normalizeGeneratedQuestion(item);
    if (!draft || draft.kind !== mode) return null;
    drafts.push(draft);
  }
  return drafts;
}

export function practiceOutputSchema(mode: PracticeGenerateMode) {
  const properties: Record<string, unknown> = {
    kind: { type: "string", enum: [mode] },
    prompt: { type: "string" },
    model_answer: { type: "string" },
    explanation: { type: "string" },
    slide_reference: { type: "string" },
  };
  const required = ["kind", "prompt", "model_answer", "explanation", "slide_reference"];
  if (mode === "mcq") {
    properties.choices = {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "text"],
        properties: {
          id: { type: "string", enum: [...CHOICE_IDS] },
          text: { type: "string" },
        },
      },
    };
    properties.correct_choice_id = { type: "string", enum: [...CHOICE_IDS] };
    required.push("choices", "correct_choice_id");
  }
  return {
    type: "object",
    additionalProperties: false,
    required: ["questions"],
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required,
          properties,
        },
      },
    },
  };
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
