"use client";

const cache = new Map<string, { url: string; expiresAt: number }>();

export async function getSignedNoteImageUrl(
  path: string,
  idToken: string
): Promise<string> {
  const cached = cache.get(path);
  if (cached && cached.expiresAt > Date.now() + 30_000) {
    return cached.url;
  }

  const res = await fetch(`/api/notes/images/sign?path=${encodeURIComponent(path)}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to load image");
  }
  const { url } = await res.json();
  cache.set(path, { url, expiresAt: Date.now() + 270_000 });
  return url;
}

export function invalidateSignedNoteImageUrl(path: string) {
  cache.delete(path);
}

export async function uploadNoteImage(file: File, idToken: string): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/notes/images", {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Image upload failed");
  }
  const data = await res.json();
  return data.path as string;
}
