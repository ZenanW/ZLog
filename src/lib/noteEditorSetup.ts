import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { NoteImage } from "@/components/NoteImageExtension";
import { validateNoteImageFile } from "@/lib/noteImages";
import { uploadNoteImage } from "@/lib/noteImageClient";

export function createNoteEditorExtensions(placeholder: string) {
  return [StarterKit, Placeholder.configure({ placeholder }), NoteImage];
}

export async function insertImagesIntoEditor(
  editor: Editor,
  files: File[],
  idToken: string | null,
  onError: (message: string) => void
) {
  if (!idToken) {
    onError("Sign in required to upload images.");
    return;
  }

  const imageFiles = files.filter((f) => f.type.startsWith("image/"));
  if (imageFiles.length === 0) return;

  for (const file of imageFiles) {
    const validationError = validateNoteImageFile(file);
    if (validationError) {
      onError(validationError);
      continue;
    }
    try {
      const path = await uploadNoteImage(file, idToken);
      editor
        .chain()
        .focus()
        .insertContent([
          {
            type: "image",
            attrs: { storagePath: path, alt: file.name, wrapMode: "block" },
          },
          { type: "paragraph" },
        ])
        .focus("end")
        .run();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Image upload failed");
    }
  }
}

export function createEditorImageHandlers(
  getEditor: () => Editor | null,
  idToken: string | null,
  onError: (message: string) => void
) {
  const handleFiles = (fileList: FileList | null | undefined) => {
    const editor = getEditor();
    if (!editor || !fileList?.length) return false;
    const imageFiles = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return false;
    void insertImagesIntoEditor(editor, imageFiles, idToken, onError);
    return true;
  };

  return {
    handleDrop: (_view: unknown, event: DragEvent, _slice: unknown, moved: boolean) => {
      if (moved) return false;
      const dt = event.dataTransfer;
      if (!dt?.files?.length) return false;
      const hasImageFile = Array.from(dt.files).some((f) => f.type.startsWith("image/"));
      if (!hasImageFile) return false;
      const handled = handleFiles(dt.files);
      if (handled) event.preventDefault();
      return handled;
    },
    handlePaste: (_view: unknown, event: ClipboardEvent) => {
      if (!event.clipboardData?.files?.length) return false;
      const handled = handleFiles(event.clipboardData.files);
      if (handled) event.preventDefault();
      return handled;
    },
  };
}
