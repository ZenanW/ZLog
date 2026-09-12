import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { mapPracticeSetFromDb, missingPracticeTablesMessage } from "@/lib/practice";
import { getSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    const { data, error } = await getSupabase()
      .from("practice_sets")
      .select("*, practice_questions(*)")
      .eq("user_id", userId)
      .order("generated_at", { ascending: false });

    if (error) {
      const hint = missingPracticeTablesMessage(error.message);
      return NextResponse.json({ error: hint ?? error.message }, { status: 500 });
    }

    return NextResponse.json((data ?? []).map((row) => mapPracticeSetFromDb(row)));
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
