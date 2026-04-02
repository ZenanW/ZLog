import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyToken(request);
    const { id: examId } = await params;

    const { data, error } = await getSupabase()
      .from("practice_tests")
      .select("*")
      .eq("user_id", userId)
      .eq("exam_id", examId)
      .order("taken_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyToken(request);
    const { id: examId } = await params;
    const body = await request.json();

    const { data, error } = await getSupabase()
      .from("practice_tests")
      .insert({
        id: body.id,
        user_id: userId,
        exam_id: examId,
        title: body.title,
        score: body.score ?? null,
        max_score: body.maxScore ?? null,
        notes: body.notes ?? "",
        taken_at: body.takenAt ?? new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
