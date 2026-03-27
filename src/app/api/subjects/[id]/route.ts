import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyToken(request);
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await getSupabase()
      .from("subjects")
      .update(body)
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
      .from("subjects")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
