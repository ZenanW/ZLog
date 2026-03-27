import { NextResponse } from "next/server";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }
  setTimeout(() => process.exit(0), 500);
  return NextResponse.json({ ok: true });
}
