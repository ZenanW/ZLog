/**
 * Anthropic Files API helpers (beta). Used so large PDFs are not base64'd
 * into the Messages request (32 MB payload cap).
 */

const FILES_URL = "https://api.anthropic.com/v1/files";
const FILES_BETA = "files-api-2025-04-14";

export const ANTHROPIC_FILES_BETA = FILES_BETA;

/** Base64 inflates ~33%; stay well under the 32 MB Messages payload cap. */
export const INLINE_PDF_THRESHOLD = 8 * 1024 * 1024;

export function shouldUseFilesApi(byteLengths: number[]): boolean {
  const total = byteLengths.reduce((sum, n) => sum + n, 0);
  return byteLengths.some((n) => n >= INLINE_PDF_THRESHOLD) || total >= 16 * 1024 * 1024;
}

export async function uploadAnthropicPdf(
  apiKey: string,
  bytes: Buffer,
  filename: string
): Promise<string> {
  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
    filename.endsWith(".pdf") ? filename : `${filename}.pdf`
  );

  const res = await fetch(FILES_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": FILES_BETA,
    },
    body: form,
  });

  const body = await res.json().catch(() => null);
  if (!res.ok || typeof body?.id !== "string") {
    const message = body?.error?.message ?? `Claude Files API error (${res.status})`;
    throw new Error(message);
  }
  return body.id as string;
}

export async function deleteAnthropicFile(apiKey: string, fileId: string): Promise<void> {
  await fetch(`${FILES_URL}/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": FILES_BETA,
    },
  }).catch(() => undefined);
}
