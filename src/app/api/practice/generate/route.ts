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
  practiceCountFor,
  practiceOutputSchema,
  practiceRequestCountFor,
  type PracticeGenerateMode,
} from "@/lib/practice";
import { latestOfEachKind, PDF_BUCKET, safePdfFileName } from "@/lib/pdfs";
import { getSupabase } from "@/lib/supabase";
import {
  isPdfDocumentKind,
  PDF_KIND_LABELS,
  PDF_KINDS,
  PdfKind,
  PracticeQuestion,
  PracticeSet,
} from "@/lib/types";

export const maxDuration = 120;

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-5";

function generatePrompt(lectureTitle: string, kinds: PdfKind[], mode: PracticeGenerateMode): string {
  const attached = kinds.map((kind) => `- ${PDF_KIND_LABELS[kind]}`).join("\n");
  const count = practiceCountFor(mode);
  const writeCount = practiceRequestCountFor(mode);
  const task = mode === "mcq"
    ? `Write ${writeCount} multiple-choice questions in the questions array, in order. Every question has kind "mcq". Do not write short-answer questions. Set model_answer to an empty string. Do not stop before ${writeCount}. The first ${count} are the ones a student will see, so make those the strongest and most varied. Later questions are spares.`
    : `Write ${writeCount} short-answer questions in the questions array, in order. Every question has kind "short". Do not write multiple-choice questions. Do not stop before ${writeCount}. The first ${count} are the ones a student will see, so make those the strongest. Later questions are spares.`;
  const diversity = mode === "mcq"
    ? `Mix cognitive demand across the first ${count}: at least three recall, four application or worked procedure, and three comparison, edge-case, or "what goes wrong if…".
- MCQ distractors must be plausible and drawn from nearby concepts (common confusions, swapped terms, off-by-one conditions). No joke or obviously-wrong options.`
    : `Each short answer must require a short explanation (why / how / tradeoff), not a one-word label.
- model_answer is 2–4 sentences a strong student would write. explanation says how to self-check.`;
  const format = mode === "mcq"
    ? `MCQ: exactly ${PRACTICE_MCQ_CHOICES} choices with ids a, b, c, d. correct_choice_id is one of those ids. Put the correct choice in a varied position — not always a.`
    : `Short: model_answer is the non-empty answer the student should compare against.`;

  return `You are writing a university practice set from the attached weekly materials. The lecture is titled "${lectureTitle}".

Materials attached:
${attached}

${task} Finish each question object completely before starting the next so they can be shown as they are written.

How to use the materials:
- Every item must be answerable from THESE files. Do not invent facts, formulas, names, or examples that are not in them.
- Slides: core concepts, definitions, diagrams, and procedures.
- Tutorial sheet: the skills students are expected to practice. Do not copy worksheet items verbatim — write new questions that test the same ideas.
- Tutorial answers: ground truth for worked problems. Use them so answer keys and model answers are correct. Do not paste answer-sheet solutions as the question prompt.
- Transcript: spoken emphasis, asides, and what the lecturer stressed. Prefer those when they add something the slides do not.
- Use only the kinds that are actually attached. Skip slide numbers, layout, fonts, and "what is on slide N".

Diversity — do not cluster:
- Spread items across distinct sections or headings. Do not take most questions from the first few pages or a single definition.
- ${diversity}
- Vary the stem. Not every question should be "What is X?" or "Which of the following…".

Format:
- ${format}
- slide_reference: a short source cue (slide title, tutorial heading, or a short transcript phrase). Empty string if none.
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
  const mode: PracticeGenerateMode | null = body.mode === "mcq" || body.mode === "short" ? body.mode : null;
  if (!lectureId) {
    return NextResponse.json({ error: "lectureId is required" }, { status: 400 });
  }
  if (!mode) {
    return NextResponse.json({ error: "mode must be mcq or short" }, { status: 400 });
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

  const { data: fileRows, error: filesError } = await supabase
    .from("pdf_documents")
    .select("kind, name, path")
    .eq("user_id", userId)
    .eq("lecture_id", lectureId)
    .in("kind", [...PDF_KINDS])
    .order("created_at", { ascending: false });
  if (filesError) {
    return NextResponse.json({ error: filesError.message }, { status: 500 });
  }

  const weeklyFiles = latestOfEachKind(
    (fileRows ?? []).flatMap((row) => {
      const kind = row.kind as PdfKind;
      if (!PDF_KINDS.includes(kind)) return [];
      return [{ kind, name: String(row.name ?? ""), path: String(row.path ?? "") }];
    })
  );
  if (weeklyFiles.length === 0) {
    return NextResponse.json(
      { error: "Upload slides, a tutorial, answers, or a transcript on this lecture before generating." },
      { status: 400 }
    );
  }

  const loaded: { kind: PdfKind; name: string; bytes: Buffer }[] = [];
  for (const file of weeklyFiles) {
    const { data: blob, error: downloadError } = await supabase.storage
      .from(PDF_BUCKET)
      .download(file.path);
    if (downloadError || !blob) {
      return NextResponse.json(
        { error: downloadError?.message ?? `Could not read ${PDF_KIND_LABELS[file.kind].toLowerCase()} from storage` },
        { status: 500 }
      );
    }
    loaded.push({
      kind: file.kind,
      name: file.name,
      bytes: Buffer.from(await blob.arrayBuffer()),
    });
  }

  const pdfs = loaded.filter((file) => isPdfDocumentKind(file.kind));
  const useFiles = shouldUseFilesApi(pdfs.map((file) => file.bytes.length));
  const fileIds: string[] = [];
  const contentBlocks: Record<string, unknown>[] = [];
  const promptKinds: PdfKind[] = [];

  try {
    for (const file of loaded) {
      const label = PDF_KIND_LABELS[file.kind].toLowerCase();
      if (isPdfDocumentKind(file.kind)) {
        contentBlocks.push({
          type: "text",
          text: `The next document is the ${label} (${file.name || `${file.kind}.pdf`}).`,
        });
        if (useFiles) {
          const fileId = await uploadAnthropicPdf(
            apiKey,
            file.bytes,
            safePdfFileName(file.name || `${file.kind}.pdf`)
          );
          fileIds.push(fileId);
          contentBlocks.push({
            type: "document",
            source: { type: "file", file_id: fileId },
            cache_control: { type: "ephemeral" },
          });
        } else {
          contentBlocks.push({
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: file.bytes.toString("base64") },
            cache_control: { type: "ephemeral" },
          });
        }
        promptKinds.push(file.kind);
      } else {
        const transcript = file.bytes.toString("utf8").replace(/^\uFEFF/, "").trim();
        if (!transcript) continue;
        contentBlocks.push({
          type: "text",
          text: `The following is the lecture transcript (${file.name || "transcript.txt"}):\n\n${transcript}`,
        });
        promptKinds.push(file.kind);
      }
    }
  } catch (err) {
    await Promise.all(fileIds.map((id) => deleteAnthropicFile(apiKey, id)));
    const message = err instanceof Error ? err.message : "Could not send weekly files to Claude";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (contentBlocks.length === 0 || promptKinds.length === 0) {
    return NextResponse.json(
      { error: "Upload slides, a tutorial, answers, or a transcript on this lecture before generating." },
      { status: 400 }
    );
  }

  contentBlocks.push({ type: "text", text: generatePrompt(lecture.title as string, promptKinds, mode) });

  const headers: Record<string, string> = {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  };
  if (fileIds.length > 0) headers["anthropic-beta"] = ANTHROPIC_FILES_BETA;

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
      let consumed = 0;
      const expected = practiceCountFor(mode);

      try {
        send({ type: "start", set: emptySet, total: expected });

        let anthropicRes: Response;
        try {
          anthropicRes = await fetch(ANTHROPIC_URL, {
            method: "POST",
            headers,
            body: JSON.stringify({
              model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
              max_tokens: mode === "mcq" ? 24000 : 16000,
              stream: true,
              messages: [
                {
                  role: "user",
                  content: contentBlocks,
                },
              ],
              output_config: {
                format: {
                  type: "json_schema",
                  schema: practiceOutputSchema(mode),
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
              while (consumed < objects.length && questions.length < expected) {
                const draft = normalizeGeneratedQuestion(objects[consumed]);
                consumed += 1;
                if (!draft || draft.kind !== mode) continue;
                const question = draftToQuestion(draft, setId, questions.length);
                questions.push(question);
                send({ type: "question", question, total: expected });
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
        if (sseBuf.trim()) flushSse("\n\n");

        if (questions.length < expected) {
          try {
            const drafts = normalizeGeneratedQuestions(JSON.parse(jsonBuf), mode);
            if (drafts) {
              questions.length = 0;
              for (const draft of drafts) {
                questions.push(draftToQuestion(draft, setId, questions.length));
              }
            }
          } catch {
            /* incomplete stream */
          }
        }

        if (questions.length > expected) questions.length = expected;

        if (questions.length < expected) {
          if (stopReason === "max_tokens") {
            send({ type: "error", error: "Claude ran out of tokens — try generating again." });
            return;
          }
          if (stopReason === "refusal") {
            send({ type: "error", error: "Claude declined to write a practice set from these files." });
            return;
          }
          if (stopReason === "model_context_window_exceeded") {
            send({ type: "error", error: "These files are too long for one practice set." });
            return;
          }
          send({ type: "error", error: "Claude returned an incomplete practice set. Try generating again." });
          return;
        }

        const saved = await persistSet(userId, lectureId, setId, now, questions);
        send({ type: "done", set: saved });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to generate practice set";
        send({ type: "error", error: missingPracticeTablesMessage(message) ?? message });
      } finally {
        if (fileIds.length > 0) {
          await Promise.all(fileIds.map((id) => deleteAnthropicFile(apiKey, id)));
        }
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
