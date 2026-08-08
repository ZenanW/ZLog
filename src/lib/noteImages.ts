export const NOTE_IMAGES_BUCKET = "note-images";
export const MAX_NOTE_IMAGE_SIZE = 5 * 1024 * 1024;
export const NOTE_IMAGE_SIGN_TTL_SECONDS = 300;

export const NOTE_IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif"] as const;

export const MAX_NOTE_IMAGE_DISPLAY_WIDTH = 480;

export type NoteImageWrapMode = "block" | "left" | "right" | "center";

export const NOTE_IMAGE_WRAP_MODES: NoteImageWrapMode[] = ["block", "left", "right", "center"];

export const NOTE_IMAGE_WRAP_LABELS: Record<NoteImageWrapMode, string> = {
  block: "Block",
  left: "Wrap left",
  right: "Wrap right",
  center: "Center",
};

export function normalizeNoteImageWrapMode(value: unknown): NoteImageWrapMode {
  if (value === "left" || value === "right" || value === "center") return value;
  return "block";
}

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function extensionForImageMime(mime: string): string | null {
  return MIME_TO_EXT[mime] ?? null;
}

export function validateNoteImageFile(file: File): string | null {
  if (!extensionForImageMime(file.type)) {
    return "Only PNG, JPEG, WebP, and GIF images are allowed.";
  }
  if (file.size > MAX_NOTE_IMAGE_SIZE) {
    return "Image exceeds the 5 MB limit.";
  }
  return null;
}

export function isAllowedImageBytes(bytes: Buffer): boolean {
  if (bytes.length < 12) return false;
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const gif = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38;
  const webp =
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;
  return png || jpeg || gif || webp;
}

export function noteImagePathOwnedByUser(path: string, userId: string): boolean {
  return path.startsWith(`${userId}/`) && !path.includes("..");
}
