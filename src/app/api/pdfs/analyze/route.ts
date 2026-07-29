import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { mapPdfFromDb, PDF_BUCKET } from "@/lib/pdfs";
import { Priority } from "@/lib/types";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-5";

const PROMPT = `You are helping a university student triage their study backlog.
The attached PDF is either lecture slides or a tutorial sheet.

Respond with ONLY a JSON object (no markdown fences, no prose) in this exact shape:
{
  "summary": "<2-4 plain-language sentences: what this PDF is and what it covers>",
  "priority": "<low | medium | high — how urgently the student should work through it>",
  "priorityReason": "<one sentence explaining the priority>",
  "difficulty": <integer 1-7, where 1 is trivial and 7 is extremely hard>
}`;

interface AnalysisResult {
  summary: string;
  priority: Priority;
  priorityReason: string;
  difficulty: number;
}

function parseAnalysis(text: string): AnalysisResult | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const raw = JSON.parse(match[0]);
    const priority: Priority = ["low", "medium", "high"].includes(raw.priority) ? raw.priority : "medium";
    const difficulty = Math.min(7, Math.max(1, Math.round(Number(raw.difficulty)) || 4));
    if (typeof raw.summary !== "string" || !raw.summary) return null;
    return {
      summary: raw.summary,
      priority,
      priorityReason: typeof raw.priorityReason === "string" ? raw.priorityReason : "",
      difficulty,
    };
  } catch {
    return null;
  }
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

  const { id } = await request.json().catch(() => ({}));
  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data: row, error: fetchError } = await supabase
    .from("pdf_documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (fetchError || !row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: blob, error: downloadError } = await supabase.storage
    .from(PDF_BUCKET)
    .download(row.path);
  if (downloadError || !blob) {
    return NextResponse.json({ error: downloadError?.message ?? "Could not read PDF from storage" }, { status: 500 });
  }
  const base64 = Buffer.from(await blob.arrayBuffer()).toString("base64");

  const anthropicRes = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: base64 },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    }),
  });

  const anthropicBody = await anthropicRes.json().catch(() => null);
  if (!anthropicRes.ok) {
    const message = anthropicBody?.error?.message ?? `Claude API error (${anthropicRes.status})`;
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const text = (anthropicBody?.content ?? [])
    .filter((block: { type: string }) => block.type === "text")
    .map((block: { text: string }) => block.text)
    .join("\n");
  const analysis = parseAnalysis(text);
  if (!analysis) {
    return NextResponse.json({ error: "Claude returned an unparseable response; try again" }, { status: 502 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("pdf_documents")
    .update({
      summary: analysis.summary,
      priority_recommendation: analysis.priority,
      priority_reason: analysis.priorityReason,
      difficulty: analysis.difficulty,
      analyzed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json(mapPdfFromDb(updated));
}
