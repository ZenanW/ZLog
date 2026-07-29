import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { PDF_BUCKET } from "@/lib/pdfs";

const EXPIRES_IN_SECONDS = 300;

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    // Look up the storage path server-side; clients never handle raw paths.
    const { data: row, error: fetchError } = await getSupabase()
      .from("pdf_documents")
      .select("path")
      .eq("id", id)
      .eq("user_id", userId)
      .single();
    if (fetchError || !row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data, error } = await getSupabase()
      .storage.from(PDF_BUCKET)
      .createSignedUrl(row.path, EXPIRES_IN_SECONDS);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ url: data.signedUrl });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
