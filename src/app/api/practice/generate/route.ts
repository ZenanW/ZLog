import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import {
  ANTHROPIC_FILES_BETA,
  deleteAnthropicFile,
  shouldUseFilesApi,
  uploadAnthropicPdf,
} from "@/lib/anthropicFiles";
import {
  extractQuestionObjects,
  GeneratedQuestionDraft,
  mapPracticeSetFromDb,
  missingPracticeTablesMessage,
  normalizeGeneratedQuestion,
  normalizeGeneratedQuestions,
  PRACTICE_MCQ_CHOICES,
  PRACTICE_MCQ_COUNT,
  PRACTICE_OUTPUT_SCHEMA,
  PRACTICE_SET_SIZE,
  PRACTICE_SHORT_COUNT,
} from "@/lib/practice";
import { PDF_BUCKET, safePdfFileName } from "@/lib/pdfs";
import { getSupabase } from "@/lib/supabase";
import { PracticeQuestion, PracticeSet } from "@/lib/types";

export const maxDuration = 120;

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-opus-5";

function generatePrompt(lectureTitle: string): string {
  return `You are writing a university practice set from the attached lecture slides (the first document). The lecture is titled "${lectureTitle}".

Return exactly ${PRACTICE_MCQ_COUNT} multiple-choice questions and ${PRACTICE_SHORT_COUNT} short-answer questions, in that order. Finish each question object completely before starting the next so they can be shown as they are written.

Relevance — every item must come from THESE slides:
- Answerable only from the attached PDF. Do not invent facts, formulas, names, or examples that are not in the deck.
- Test what the slides actually teach: definitions, mechanisms, conditions, procedures, diagrams, and worked examples.
- Skip topics mentioned only in passing. Skip slide numbers, layout, fonts, speaker notes, and "what is on slide N".
- Prefer the lecture's own wording and claims over generic textbook filler.

Diversity — do not cluster:
- Spread items across distinct sections or headings. Do not take most questions from the first few slides or a single definition.
- Among the MCQs, mix cognitive demand: at least two recall, two application / worked procedure, and two comparison, edge-case, or "what goes wrong if…".
- Short answers must require a short explanation (why / how / tradeoff), not a one-word label.
- Vary the stem. Not every question should be "What is X?" or "Which of the following…".
- MCQ distractors must be plausible and drawn from nearby slide concepts (common confusions, swapped terms, off-by-one conditions). No joke or obviously-wrong options.

Format:
- MCQ: exactly ${PRACTICE_MCQ_CHOICES} choices with ids a, b, c, d. Exactly one correct. Put the correct choice in a varied position — not always a.
- Short: model_answer is 2–4 sentences a strong student would write. explanation says how to self-check.
- slide_reference: the slide title or topic heading from the PDF (for example "Gradient descent — step size"). Use an empty string if the deck has no usable titles.
- explanation: one or two sentences a student can read after answering.`;
}

function draftToQuestion(draft: GeneratedQuestionDraft, setId: string, index: number): PracticeQuestion {
  return {
    id: crypto.randomUUID(),
    setId,
    sortOrder: index,
    kind: draft.kind,
    prompt: draft.prompt,
    choices: draft.choices,
    correctChoiceId: draft.correctChoiceId,
    modelAnswer: draft.modelAnswer,
    explanation: draft.explanation,
    slideReference: draft.slideReference,
  };
}

function sseLine(payload: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

async function persistSet(
  userId: string,
  lectureId: string,
  setId: string,
  now: string,
  questions: PracticeQuestion[]
): Promise<PracticeSet> {
  const supabase = getSupabase();
  const { error: deleteError } = await supabase
    .from("practice_sets")
    .delete()
    .eq("user_id", userId)
    .eq("lecture_id", lectureId);
  if (deleteError) {
    throw new Error(missingPracticeTablesMessage(deleteError.message) ?? deleteError.message);
  }

  const { data: setRow, error: setError } = await supabase
    .from("practice_sets")
    .insert({
      id: setId,
      user_id: userId,
      lecture_id: lectureId,
      generated_at: now,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();
  if (setError || !setRow) {
    throw new Error(
      (setError ? missingPracticeTablesMessage(setError.message) : null) ??
        setError?.message ??
        "Could not save practice set"
    );
  }

  const questionRows = questions.map((question) => ({
    id: question.id,
    set_id: setId,
    sort_order: question.sortOrder,
    kind: question.kind,
    prompt: question.prompt,
    choices: question.choices,
    correct_choice_id: question.correctChoiceId,
    model_answer: question.modelAnswer,
    explanation: question.explanation,
    slide_reference: question.slideReference,
  }));

  const { data: insertedQuestions, error: questionError } = await supabase
    .from("practice_questions")
    .insert(questionRows)
    .select();
  if (questionError || !insertedQuestions) {
    await supabase.from("practice_sets").delete().eq("id", setId).eq("user_id", userId);
    throw new Error(questionError?.message ?? "Could not save questions");
  }

  return mapPracticeSetFromDb({
    ...setRow,
    practice_questions: insertedQuestions,
  });
}

export async function POST(request: NextRequest) {
  let userId: string;
  try {
    userId = await verifyToken(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured on the server" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const lectureId = typeof body.lectureId === "string" ? body.lectureId : "";
  if (!lectureId) {
    return NextResponse.json({ error: "lectureId is required" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data: lecture, error: lectureError } = await supabase
    .from("lectures")
    .select("id, title")
    .eq("id", lectureId)
    .eq("user_id", userId)
    .maybeSingle();
  if (lectureError || !lecture) {
    return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
  }

  const { data: pdfRow, error: pdfError } = await supabase
    .from("pdf_documents")
    .select("name, path")
    .eq("user_id", userId)
    .eq("lecture_id", lectureId)
    .eq("kind", "lecture_slides")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (pdfError || !pdfRow) {
    return NextResponse.json(
      { error: "Upload lecture slides on this lecture before generating a practice set." },
      { status: 400 }
    );
  }

  const { data: blob, error: downloadError } = await supabase.storage
    .from(PDF_BUCKET)
    .download(pdfRow.path);
  if (downloadError || !blob) {
    return NextResponse.json({ error: downloadError?.message ?? "Could not read slides from storage" }, { status: 500 });
  }

  const bytes = Buffer.from(await blob.arrayBuffer());
  const filename = safePdfFileName(pdfRow.name || "slides.pdf");
  const useFiles = shouldUseFilesApi([bytes.length]);

  let fileId: string | null = null;
  let documentBlock: Record<string, unknown>;
  try {
    if (useFiles) {
      fileId = await uploadAnthropicPdf(apiKey, bytes, filename);
      documentBlock = {
        type: "document",
        source: { type: "file", file_id: fileId },
        cache_control: { type: "ephemeral" },
      };
    } else {
      documentBlock = {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: bytes.toString("base64") },
        cache_control: { type: "ephemeral" },
      };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not send slides to Claude";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const headers: Record<string, string> = {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  };
  if (fileId) headers["anthropic-beta"] = ANTHROPIC_FILES_BETA;

  const now = new Date().toISOString();
  const setId = crypto.randomUUID();
  const emptySet: PracticeSet = {
    id: setId,
    lectureId,
    generatedAt: now,
    createdAt: now,
    updatedAt: now,
    questions: [],
  };

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => controller.enqueue(sseLine(payload));
      const questions: PracticeQuestion[] = [];

      try {
        send({ type: "start", set: emptySet, total: PRACTICE_SET_SIZE });

        let anthropicRes: Response;
        try {
          anthropicRes = await fetch(ANTHROPIC_URL, {
            method: "POST",
            headers,
            body: JSON.stringify({
              model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
              max_tokens: 8192,
              stream: true,
              messages: [
                {
                  role: "user",
                  content: [
                    documentBlock,
                    { type: "text", text: generatePrompt(lecture.title as string) },
                  ],
                },
              ],
              output_config: {
                format: {
                  type: "json_schema",
                  schema: PRACTICE_OUTPUT_SCHEMA,
                },
              },
            }),
          });
        } catch {
          send({ type: "error", error: "Could not reach Claude. Try generating again." });
          return;
        }

        if (!anthropicRes.ok || !anthropicRes.body) {
          const anthropicBody = await anthropicRes.json().catch(() => null);
          const message = anthropicBody?.error?.message ?? `Claude API error (${anthropicRes.status})`;
          send({ type: "error", error: message });
          return;
        }

        const reader = anthropicRes.body.getReader();
        const decoder = new TextDecoder();
        let sseBuf = "";
        let jsonBuf = "";
        let stopReason: string | null = null;

        const flushSse = (chunk: string) => {
          sseBuf += chunk;
          const parts = sseBuf.split("\n\n");
          sseBuf = parts.pop() ?? "";
          for (const part of parts) {
            for (const line of part.split("\n")) {
              if (!line.startsWith("data: ")) continue;
              const raw = line.slice(6);
              if (raw === "[DONE]") continue;
              let event: Record<string, unknown>;
              try {
                event = JSON.parse(raw) as Record<string, unknown>;
              } catch {
                continue;
              }
              if (event.type === "error") {
                const err = event.error as { message?: string } | undefined;
                throw new Error(err?.message ?? "Claude stream error");
              }
              if (event.type === "message_delta") {
                const delta = event.delta as { stop_reason?: string } | undefined;
                if (delta?.stop_reason) stopReason = delta.stop_reason;
              }
              if (event.type !== "content_block_delta") continue;
              const delta = event.delta as { type?: string; text?: string } | undefined;
              if (delta?.type !== "text_delta" || typeof delta.text !== "string") continue;
              jsonBuf += delta.text;
              const objects = extractQuestionObjects(jsonBuf);
              while (questions.length < objects.length) {
                const draft = normalizeGeneratedQuestion(objects[questions.length]);
                if (!draft) break;
                const question = draftToQuestion(draft, setId, questions.length);
                questions.push(question);
                send({ type: "question", question, total: PRACTICE_SET_SIZE });
              }
            }
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          flushSse(decoder.decode(value, { stream: true }));
        }
        flushSse(decoder.decode());

        if (stopReason === "max_tokens") {
          send({ type: "error", error: "Claude ran out of tokens — try generating again." });
          return;
        }

        if (questions.length === 0) {
          try {
            const parsed = JSON.parse(jsonBuf);
            const drafts = normalizeGeneratedQuestions(parsed);
            if (drafts) {
              for (const draft of drafts) {
                const question = draftToQuestion(draft, setId, questions.length);
                questions.push(question);
                send({ type: "question", question, total: PRACTICE_SET_SIZE });
              }
            }
          } catch {
            /* incomplete stream */
          }
        }

        if (questions.length === 0) {
          send({ type: "error", error: "Claude returned an incomplete practice set. Try generating again." });
          return;
        }

        const saved = await persistSet(userId, lectureId, setId, now, questions);
        send({ type: "done", set: saved });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to generate practice set";
        send({ type: "error", error: missingPracticeTablesMessage(message) ?? message });
      } finally {
        if (fileId) await deleteAnthropicFile(apiKey, fileId);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
