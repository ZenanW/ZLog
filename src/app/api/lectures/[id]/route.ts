import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyToken(request);
    const { id } = await params;
    const body = await request.json();

    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) dbUpdates.title = body.title;
    if (body.notes !== undefined) dbUpdates.notes = body.notes;
    if (body.status !== undefined) dbUpdates.status = body.status;
    if (body.priority !== undefined) dbUpdates.priority = body.priority;
    if (body.duration !== undefined) dbUpdates.duration = body.duration;
    if (body.lectureDate !== undefined) dbUpdates.lecture_date = body.lectureDate;
    if (body.subjectId !== undefined) dbUpdates.subject_id = body.subjectId;
    if (body.tags !== undefined) dbUpdates.tags = body.tags;

    const { data, error } = await supabase
      .from("lectures")
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

    const { error } = await supabase
      .from("lectures")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
