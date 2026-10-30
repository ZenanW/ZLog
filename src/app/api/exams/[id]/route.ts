import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyToken(request);
    const { id } = await params;
    const body = await request.json();

    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
      dbUpdates.name = name;
    }
    if (body.examDate !== undefined) dbUpdates.exam_date = body.examDate;
    if (body.subjectId !== undefined) {
      if (typeof body.subjectId !== "string" || !body.subjectId) {
        return NextResponse.json({ error: "Subject is required" }, { status: 400 });
      }
      dbUpdates.subject_id = body.subjectId;
    }

    const { data, error } = await getSupabase()
      .from("exams")
      .update(dbUpdates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyToken(request);
    const { id } = await params;

    const { error } = await getSupabase()
      .from("exams")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
