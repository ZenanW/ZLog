import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { mapPdfFromDb, PDF_BUCKET, MAX_PDF_SIZE } from "@/lib/pdfs";
import { PDF_KINDS, PdfKind } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    const lectureId = request.nextUrl.searchParams.get("lectureId");

    const query = getSupabase()
      .from("pdf_documents")
      .select("*")
      .eq("user_id", userId);

    if (lectureId) {
      query.eq("lecture_id", lectureId);
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json((data ?? []).map(mapPdfFromDb));
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    const form = await request.formData();

    const file = form.get("file");
    const lectureId = form.get("lectureId");
    const kind = form.get("kind");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (typeof lectureId !== "string" || !lectureId) {
      return NextResponse.json({ error: "lectureId is required" }, { status: 400 });
    }
    if (typeof kind !== "string" || !PDF_KINDS.includes(kind as PdfKind)) {
      return NextResponse.json({ error: "kind must be lecture_slides or tutorial_sheet" }, { status: 400 });
    }
    if (file.size > MAX_PDF_SIZE) {
      return NextResponse.json({ error: "File exceeds the 20MB limit" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    // Check magic bytes rather than trusting the client-supplied MIME type.
    if (!bytes.subarray(0, 5).toString("latin1").startsWith("%PDF-")) {
      return NextResponse.json({ error: "File is not a valid PDF" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "file.pdf";
    const path = `${userId}/${lectureId}/${kind}/${id}-${safeName}`;

    const storage = getSupabase().storage.from(PDF_BUCKET);
    const { error: uploadError } = await storage.upload(path, bytes, {
      contentType: "application/pdf",
    });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data, error } = await getSupabase()
      .from("pdf_documents")
      .insert({
        id,
        user_id: userId,
        lecture_id: lectureId,
        kind,
        name: safeName,
        path,
        size: file.size,
      })
      .select()
      .single();

    if (error) {
      // Don't leave an orphaned storage object behind.
      await storage.remove([path]);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(mapPdfFromDb(data), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const supabase = getSupabase();
    const { data: row, error: fetchError } = await supabase
      .from("pdf_documents")
      .select("path")
      .eq("id", id)
      .eq("user_id", userId)
      .single();
    if (fetchError || !row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await supabase.storage.from(PDF_BUCKET).remove([row.path]);
    const { error } = await supabase
      .from("pdf_documents")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
