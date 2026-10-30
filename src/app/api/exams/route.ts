import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    const { data, error } = await getSupabase()
      .from("exams")
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
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (typeof body.subjectId !== "string" || !body.subjectId) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }

    const { data, error } = await getSupabase()
      .from("exams")
      .insert({
        id: body.id,
        user_id: userId,
        subject_id: body.subjectId,
        name,
        exam_date: body.examDate ?? null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
