import { LecturePdf, PdfKind, Priority } from "@/lib/types";

export const PDF_BUCKET = "pdfs";
export const MAX_PDF_SIZE = 20 * 1024 * 1024;

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
