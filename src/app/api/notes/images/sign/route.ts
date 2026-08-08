import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import {
  NOTE_IMAGES_BUCKET,
  NOTE_IMAGE_SIGN_TTL_SECONDS,
  noteImagePathOwnedByUser,
} from "@/lib/noteImages";

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    const path = request.nextUrl.searchParams.get("path");
    if (!path) {
      return NextResponse.json({ error: "path is required" }, { status: 400 });
    }
    if (!noteImagePathOwnedByUser(path, userId)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data, error } = await getSupabase()
      .storage.from(NOTE_IMAGES_BUCKET)
      .createSignedUrl(path, NOTE_IMAGE_SIGN_TTL_SECONDS);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ url: data.signedUrl });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
