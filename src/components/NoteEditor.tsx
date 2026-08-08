"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Editor, JSONContent } from "@tiptap/react";
import {
  ArrowLeft,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link2,
  Unlink,
  ImagePlus,
} from "lucide-react";
import { Lecture, Note, NoteFormat, Subject } from "@/lib/types";
import {
  FORMAT_LABELS,
  CornellContent,
  cornellContentToPlain,
  cornellContentToRecord,
  getCornellEditorContent,
  getPlainEditorContent,
  isCornellContent,
  normalizeNoteFormat,
  plainContentToCornell,
} from "@/lib/notes";
import { insertImagesIntoEditor } from "@/lib/noteEditorSetup";
import { filterActive, filterInactive, panel } from "@/lib/ui";
import LecturePicker from "./LecturePicker";
import PlainNoteEditorBody, { CornellNoteEditorBody } from "./CornellNoteEditorBody";

interface NoteEditorProps {
  note: Note;
  subjects: Subject[];
  lectures: Lecture[];
  idToken: string | null;
  getSubject: (id: string) => Subject | undefined;
  onUpdate: (id: string, updates: Partial<Omit<Note, "id" | "createdAt">>) => void;
  onBack: () => void;
  onQuickCreateLecture: (data: {
    subjectId: string;
    title: string;
  }) => Promise<Lecture | undefined>;
}

type SaveStatus = "saved" | "saving" | "error";

const NOTE_FORMATS: NoteFormat[] = ["plain", "cornell"];

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`btn-icon ${active ? "chip-selected" : ""}`}
    >
      {children}
    </button>
  );
}

export default function NoteEditor({
  note,
  subjects,
  lectures,
  idToken,
  getSubject,
  onUpdate,
  onBack,
  onQuickCreateLecture,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [format, setFormat] = useState<NoteFormat>(normalizeNoteFormat(note.format));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [editorResetKey, setEditorResetKey] = useState(`${note.id}-${note.format}`);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Partial<Omit<Note, "id" | "createdAt">>>({});
  const noteIdRef = useRef(note.id);
  const resetCounterRef = useRef(0);
  const livePlainRef = useRef<JSONContent>(getPlainEditorContent(note.content));
  const liveCornellRef = useRef(getCornellEditorContent(note.content));

  const lecture = note.lectureId
    ? lectures.find((l) => l.id === note.lectureId)
    : undefined;
  const subject = lecture ? getSubject(lecture.subjectId) : undefined;

  const flushSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    const updates = pendingRef.current;
    if (Object.keys(updates).length > 0) {
      onUpdate(noteIdRef.current, updates);
      pendingRef.current = {};
    }
  }, [onUpdate]);

  const queueSave = useCallback(
    (updates: Partial<Omit<Note, "id" | "createdAt">>) => {
      pendingRef.current = { ...pendingRef.current, ...updates };
      setSaveStatus("saving");
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        const toSave = { ...pendingRef.current };
        pendingRef.current = {};
        try {
          onUpdate(noteIdRef.current, toSave);
          setSaveStatus("saved");
        } catch {
          setSaveStatus("error");
        }
      }, 800);
    },
    [onUpdate]
  );

  useEffect(() => {
    noteIdRef.current = note.id;
    setTitle(note.title);
    const nextFormat = normalizeNoteFormat(note.format);
    setFormat(nextFormat);
    setSaveStatus("saved");
    pendingRef.current = {};
    livePlainRef.current = getPlainEditorContent(note.content);
    liveCornellRef.current = getCornellEditorContent(note.content);
    setEditorResetKey(`${note.id}-${nextFormat}`);
    // Intentionally omit note.content — autosave updates must not reset the editor mid-typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id, note.title, note.format]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      const updates = pendingRef.current;
      if (Object.keys(updates).length > 0) {
        onUpdate(noteIdRef.current, updates);
      }
    };
  }, [onUpdate]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    queueSave({ title: value });
  };

  const handlePlainContentChange = useCallback(
    (content: JSONContent) => {
      livePlainRef.current = content;
      queueSave({ content: content as Record<string, unknown> });
    },
    [queueSave]
  );

  const handleCornellContentChange = useCallback(
    (content: CornellContent) => {
      liveCornellRef.current = content;
      queueSave({ content: cornellContentToRecord(content) });
    },
    [queueSave]
  );

  const handleFormatChange = (next: NoteFormat) => {
    if (next === format) return;

    if (next === "cornell") {
      if (
        !confirm(
          "Switch to Cornell notes? Your current content moves to the Notes column. Cue and Summary start empty."
        )
      ) {
        return;
      }
      flushSave();
      const cornell = plainContentToCornell(livePlainRef.current);
      liveCornellRef.current = cornell;
      resetCounterRef.current += 1;
      setFormat("cornell");
      setEditorResetKey(`${note.id}-cornell-${resetCounterRef.current}`);
      queueSave({ format: "cornell", content: cornellContentToRecord(cornell) });
      return;
    }

    if (
      !confirm(
        "Switch to plain paper? Content from the Notes column is kept. Cue and Summary are discarded."
      )
    ) {
      return;
    }
    flushSave();
    const plain = cornellContentToPlain(liveCornellRef.current);
    livePlainRef.current = plain;
    resetCounterRef.current += 1;
    setFormat("plain");
    setEditorResetKey(`${note.id}-plain-${resetCounterRef.current}`);
    queueSave({ format: "plain", content: plain as Record<string, unknown> });
  };

  const handleAttach = (selected: Lecture) => {
    queueSave({ lectureId: selected.id });
    setShowAttachmentPicker(false);
  };

  const handleDetach = () => {
    queueSave({ lectureId: null });
    setShowAttachmentPicker(false);
  };

  const handleEditorFocus = useCallback((editor: Editor) => {
    setActiveEditor(editor);
  }, []);

  const handleImageError = useCallback((message: string) => {
    setImageError(message);
  }, []);

  const handleInsertImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !activeEditor) return;
    setImageError(null);
    await insertImagesIntoEditor(activeEditor, Array.from(files), idToken, handleImageError);
    e.target.value = "";
  };

  const plainInitial = isCornellContent(note.content)
    ? getPlainEditorContent(note.content)
    : livePlainRef.current;
  const cornellInitial = isCornellContent(note.content)
    ? getCornellEditorContent(note.content)
    : liveCornellRef.current;

  const saveLabel =
    saveStatus === "saving" ? "Saving…" : saveStatus === "error" ? "Save failed" : "Saved";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <button type="button" onClick={() => { flushSave(); onBack(); }} className="btn-ghost flex items-center gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          All notes
        </button>
        <span
          className="text-xs"
          style={{
            color:
              saveStatus === "error"
                ? "var(--alert)"
                : saveStatus === "saving"
                  ? "var(--muted-foreground)"
                  : "var(--quiet)",
          }}
        >
          {saveLabel}
        </span>
      </div>

      <div className={`${panel} space-y-4 p-5`}>
        <div className="flex flex-wrap items-start gap-3">
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Note title"
            className="input-field min-w-0 flex-1 border-0 bg-transparent px-0 font-display text-xl outline-none"
            style={{ color: "var(--foreground)" }}
          />
          <button
            type="button"
            onClick={() => setShowAttachmentPicker((v) => !v)}
            className="chip inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium"
          >
            {note.lectureId && subject ? (
              <>
                <span className="h-2 w-2 shrink-0" style={{ backgroundColor: subject.color }} />
                {lecture?.title ?? subject.name}
              </>
            ) : (
              <>
                <Unlink className="h-3 w-3" />
                Unattached
              </>
            )}
            <Link2 className="h-3 w-3" style={{ color: "var(--muted-foreground)" }} />
          </button>
        </div>

        {showAttachmentPicker && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleDetach}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors"
              style={{ color: "var(--muted-foreground)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "color-mix(in oklch, var(--accent) 40%, transparent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Unlink className="h-3.5 w-3.5" />
              Leave unattached
            </button>
            <LecturePicker
              subjects={subjects}
              lectures={lectures}
              onSelect={handleAttach}
              onQuickCreate={onQuickCreateLecture}
              onCancel={() => setShowAttachmentPicker(false)}
            />
          </div>
        )}

        {imageError && (
          <p className="text-sm" style={{ color: "var(--alert)" }}>
            {imageError}
          </p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={handleImageFileChange}
        />

        <div
          className="flex flex-wrap items-center justify-between gap-3 border-t border-b py-2"
          style={{ borderColor: "color-mix(in oklch, var(--border) 60%, transparent)" }}
        >
          <div className="flex flex-wrap items-center gap-0.5">
            {activeEditor && (
              <>
                <ToolbarButton
                  active={activeEditor.isActive("bold")}
                  onClick={() => activeEditor.chain().focus().toggleBold().run()}
                  title="Bold"
                >
                  <Bold className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                  active={activeEditor.isActive("italic")}
                  onClick={() => activeEditor.chain().focus().toggleItalic().run()}
                  title="Italic"
                >
                  <Italic className="h-4 w-4" />
                </ToolbarButton>
                <span className="mx-1 h-4 w-px" style={{ background: "var(--border)" }} />
                <ToolbarButton
                  active={activeEditor.isActive("heading", { level: 1 })}
                  onClick={() => activeEditor.chain().focus().toggleHeading({ level: 1 }).run()}
                  title="Heading 1"
                >
                  <Heading1 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                  active={activeEditor.isActive("heading", { level: 2 })}
                  onClick={() => activeEditor.chain().focus().toggleHeading({ level: 2 }).run()}
                  title="Heading 2"
                >
                  <Heading2 className="h-4 w-4" />
                </ToolbarButton>
                <span className="mx-1 h-4 w-px" style={{ background: "var(--border)" }} />
                <ToolbarButton
                  active={activeEditor.isActive("bulletList")}
                  onClick={() => activeEditor.chain().focus().toggleBulletList().run()}
                  title="Bullet list"
                >
                  <List className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                  active={activeEditor.isActive("orderedList")}
                  onClick={() => activeEditor.chain().focus().toggleOrderedList().run()}
                  title="Numbered list"
                >
                  <ListOrdered className="h-4 w-4" />
                </ToolbarButton>
                <span className="mx-1 h-4 w-px" style={{ background: "var(--border)" }} />
                <ToolbarButton
                  active={false}
                  onClick={handleInsertImageClick}
                  title="Insert image"
                >
                  <ImagePlus className="h-4 w-4" />
                </ToolbarButton>
              </>
            )}
          </div>

          <div className="segment-track flex gap-0.5 p-0.5">
            {NOTE_FORMATS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => handleFormatChange(f)}
                className={`px-2.5 py-1 text-xs font-medium transition-all ${
                  format === f ? filterActive : filterInactive
                }`}
              >
                {FORMAT_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {format === "cornell" ? (
          <CornellNoteEditorBody
            key={editorResetKey}
            content={cornellInitial}
            resetKey={editorResetKey}
            idToken={idToken}
            onImageError={handleImageError}
            onContentChange={handleCornellContentChange}
            onEditorFocus={handleEditorFocus}
          />
        ) : (
          <PlainNoteEditorBody
            key={editorResetKey}
            content={plainInitial}
            resetKey={editorResetKey}
            idToken={idToken}
            onImageError={handleImageError}
            onContentChange={handlePlainContentChange}
            onEditorFocus={handleEditorFocus}
          />
        )}
      </div>
    </div>
  );
}
