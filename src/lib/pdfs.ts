import {
  contentTypeForKind,
  isPdfDocumentKind,
  kindFileError,
  LecturePdf,
  MAX_PDF_SIZE,
  MAX_TRANSCRIPT_SIZE,
  maxSizeForKind,
  PDF_KINDS,
  PdfKind,
  Priority,
} from "@/lib/types";

export const PDF_BUCKET = "pdfs";
export { MAX_PDF_SIZE, MAX_TRANSCRIPT_SIZE, contentTypeForKind, kindFileError, maxSizeForKind };

export function isPdfBytes(bytes: Buffer): boolean {
  return bytes.subarray(0, 5).toString("latin1").startsWith("%PDF-");
}

export function isPlainTextBytes(bytes: Buffer): boolean {
  if (bytes.length === 0) return false;
  const sample = bytes.subarray(0, Math.min(bytes.length, 8192));
  return !sample.includes(0);
}

export function fileMatchesKind(kind: PdfKind, fileName: string, bytes: Buffer): boolean {
  const lower = fileName.toLowerCase();
  if (isPdfDocumentKind(kind)) {
    return lower.endsWith(".pdf") && isPdfBytes(bytes);
  }
  return lower.endsWith(".txt") && isPlainTextBytes(bytes);
}

/** Newest-first rows in, one file per kind out, in `PDF_KINDS` order. */
export function latestOfEachKind<T extends { kind: PdfKind }>(rows: T[]): T[] {
  const newest = new Map<PdfKind, T>();
  for (const row of rows) {
    if (!PDF_KINDS.includes(row.kind) || newest.has(row.kind)) continue;
    newest.set(row.kind, row);
  }
  return PDF_KINDS.flatMap((kind) => {
    const row = newest.get(kind);
    return row ? [row] : [];
  });
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
