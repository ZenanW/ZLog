import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { PDF_BUCKET } from "@/lib/pdfs";

/**
 * Semester reset: deletes ALL of the caller's subjects, lectures, uploaded
 * PDFs (metadata rows + storage objects), exams, topics, and practice tests.
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    const supabase = getSupabase();

    // PDF cleanup is best-effort: the pdf_documents table may not exist yet
    // if the migration hasn't been run, and that shouldn't block the reset.
    const { data: pdfRows } = await supabase
      .from("pdf_documents")
      .select("path")
      .eq("user_id", userId);
    if (pdfRows && pdfRows.length > 0) {
      await supabase.storage.from(PDF_BUCKET).remove(pdfRows.map((r) => r.path));
      await supabase.from("pdf_documents").delete().eq("user_id", userId);
    }

    // Children before parents in case FKs lack ON DELETE CASCADE.
    const tables = ["lectures", "subjects", "practice_tests", "exam_topics", "exams"];
    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq("user_id", userId);
      if (error) {
        return NextResponse.json({ error: `${table}: ${error.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
