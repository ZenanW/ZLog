import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; topicId: string }> }
) {
  try {
    const userId = await verifyToken(request);
    const { topicId } = await params;
    const body = await request.json();

    const dbUpdates: Record<string, unknown> = {};
    if (body.name !== undefined) dbUpdates.name = body.name;
    if (body.revised !== undefined) dbUpdates.revised = body.revised;

    const { data, error } = await getSupabase()
      .from("exam_topics")
      .update(dbUpdates)
      .eq("id", topicId)
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
  { params }: { params: Promise<{ id: string; topicId: string }> }
) {
  try {
    const userId = await verifyToken(request);
    const { topicId } = await params;

    const { error } = await getSupabase()
      .from("exam_topics")
      .delete()
      .eq("id", topicId)
      .eq("user_id", userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
