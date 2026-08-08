import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import {
  NOTE_IMAGES_BUCKET,
  MAX_NOTE_IMAGE_SIZE,
  extensionForImageMime,
  isAllowedImageBytes,
} from "@/lib/noteImages";

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (file.size > MAX_NOTE_IMAGE_SIZE) {
      return NextResponse.json({ error: "Image exceeds the 5 MB limit" }, { status: 400 });
    }

    const ext = extensionForImageMime(file.type);
    if (!ext) {
      return NextResponse.json(
        { error: "Only PNG, JPEG, WebP, and GIF images are allowed" },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    if (!isAllowedImageBytes(bytes)) {
      return NextResponse.json({ error: "File is not a valid image" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const path = `${userId}/${id}.${ext === "jpeg" ? "jpg" : ext}`;

    const { error: uploadError } = await getSupabase()
      .storage.from(NOTE_IMAGES_BUCKET)
      .upload(path, bytes, { contentType: file.type });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    return NextResponse.json({ path }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
