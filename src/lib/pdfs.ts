import { LecturePdf, PdfKind, Priority } from "@/lib/types";

export const PDF_BUCKET = "pdfs";
/** Lecture slides / tutorial sheets — keep these modest. */
export const MAX_PDF_SIZE = 20 * 1024 * 1024;

export function isPdfBytes(bytes: Buffer): boolean {
  return bytes.subarray(0, 5).toString("latin1").startsWith("%PDF-");
}

export function safePdfFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "file.pdf";
}

export function pdfPathOwnedByUser(path: string, userId: string): boolean {
  return path.startsWith(`${userId}/`) && !path.includes("..");
}

export function mapPdfFromDb(row: Record<string, unknown>): LecturePdf {
  return {
    id: row.id as string,
    lectureId: row.lecture_id as string,
    kind: row.kind as PdfKind,
    name: row.name as string,
    size: (row.size as number) ?? 0,
    summary: (row.summary as string) ?? null,
    priorityRecommendation: (row.priority_recommendation as Priority) ?? null,
    priorityReason: (row.priority_reason as string) ?? null,
    difficulty: (row.difficulty as number) ?? null,
    analyzedAt: (row.analyzed_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}
