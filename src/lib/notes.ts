import { JSONContent, Editor } from "@tiptap/react";
import { NoteFormat } from "@/lib/types";

export const EMPTY_TIPTAP_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export interface CornellContent {
  cue: JSONContent;
  notes: JSONContent;
  summary: JSONContent;
}

export function isCornellContent(content: Record<string, unknown>): boolean {
  return (
    typeof content === "object" &&
    content !== null &&
    "cue" in content &&
    "notes" in content &&
    "summary" in content
  );
}

function normalizeDoc(doc: unknown): JSONContent {
  if (doc && typeof doc === "object" && (doc as JSONContent).type === "doc") {
    return doc as JSONContent;
  }
  return EMPTY_TIPTAP_DOC;
}

/** Normalize DB content into a single Tiptap doc (plain format). */
export function getPlainEditorContent(content: Record<string, unknown>): JSONContent {
  if (isCornellContent(content)) {
    return normalizeDoc(content.notes);
  }
  if (content && typeof content === "object" && content.type === "doc") {
    return content as JSONContent;
  }
  return EMPTY_TIPTAP_DOC;
}

/** Normalize DB content into Cornell regions. */
export function getCornellEditorContent(content: Record<string, unknown>): CornellContent {
  if (isCornellContent(content)) {
    return {
      cue: normalizeDoc(content.cue),
      notes: normalizeDoc(content.notes),
      summary: normalizeDoc(content.summary),
    };
  }
  return {
    cue: EMPTY_TIPTAP_DOC,
    notes: getPlainEditorContent(content),
    summary: EMPTY_TIPTAP_DOC,
  };
}

export function plainContentToCornell(plain: JSONContent): CornellContent {
  return {
    cue: EMPTY_TIPTAP_DOC,
    notes: plain,
    summary: EMPTY_TIPTAP_DOC,
  };
}

export function cornellContentToPlain(cornell: CornellContent): JSONContent {
  return cornell.notes;
}

export function cornellContentToRecord(cornell: CornellContent): Record<string, unknown> {
  return {
    cue: cornell.cue,
    notes: cornell.notes,
    summary: cornell.summary,
  };
}

export function normalizeNoteFormat(format: string): NoteFormat {
  if (format === "cornell") return "cornell";
  return "plain";
}

export const FORMAT_LABELS = {
  plain: "Plain paper",
  cornell: "Cornell notes",
} as const;

export const EDITOR_EXTENSIONS_CONFIG = {
  plainPlaceholder: "Start writing your notes…",
  cuePlaceholder: "Keywords, questions…",
  notesPlaceholder: "Main notes…",
  summaryPlaceholder: "Summary…",
} as const;

export type EditorFocusHandler = (editor: Editor) => void;
