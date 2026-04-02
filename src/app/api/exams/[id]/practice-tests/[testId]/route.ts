import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> }
) {
  try {
    const userId = await verifyToken(request);
    const { testId } = await params;
    const body = await request.json();

    const dbUpdates: Record<string, unknown> = {};
    if (body.title !== undefined) dbUpdates.title = body.title;
    if (body.score !== undefined) dbUpdates.score = body.score;
    if (body.maxScore !== undefined) dbUpdates.max_score = body.maxScore;
    if (body.notes !== undefined) dbUpdates.notes = body.notes;
    if (body.takenAt !== undefined) dbUpdates.taken_at = body.takenAt;

    const { data, error } = await getSupabase()
      .from("practice_tests")
      .update(dbUpdates)
      .eq("id", testId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> }
) {
  try {
    const userId = await verifyToken(request);
    const { testId } = await params;

    const { error } = await getSupabase()
      .from("practice_tests")
      .delete()
      .eq("id", testId)
      .eq("user_id", userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
