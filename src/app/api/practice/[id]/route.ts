import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { missingPracticeTablesMessage } from "@/lib/practice";
import { getSupabase } from "@/lib/supabase";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyToken(request);
    const { id } = await params;

    const { error } = await getSupabase()
      .from("practice_sets")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      const hint = missingPracticeTablesMessage(error.message);
      return NextResponse.json({ error: hint ?? error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
