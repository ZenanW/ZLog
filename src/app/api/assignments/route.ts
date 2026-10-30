import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { isAssignmentStatus } from "@/lib/types";

function parseDueDate(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value)) return undefined;
  return value;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    const { data, error } = await getSupabase()
      .from("assignments")
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
    if (body.status !== undefined && !isAssignmentStatus(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const dueDate = parseDueDate(body.dueDate);
    if (body.dueDate !== undefined && body.dueDate !== null && body.dueDate !== "" && dueDate === undefined) {
      return NextResponse.json({ error: "Invalid due date" }, { status: 400 });
    }

    const { data, error } = await getSupabase()
      .from("assignments")
      .insert({
        id: body.id,
        user_id: userId,
        subject_id: body.subjectId,
        name,
        due_date: dueDate ?? null,
        status: body.status ?? "not_started",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
