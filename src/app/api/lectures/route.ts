import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    const { data, error } = await getSupabase()
      .from("lectures")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    const body = await request.json();

    const { data, error } = await getSupabase()
      .from("lectures")
      .insert({
        id: body.id,
        user_id: userId,
        subject_id: body.subjectId,
        title: body.title,
        notes: body.notes ?? "",
        status: body.status ?? "backlog",
        priority: body.priority ?? "medium",
        duration: body.duration ?? null,
        lecture_date: body.lectureDate ?? null,
        tags: body.tags ?? [],
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
