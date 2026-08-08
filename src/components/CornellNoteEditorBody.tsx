"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent, Editor, JSONContent } from "@tiptap/react";
import { CornellContent, EDITOR_EXTENSIONS_CONFIG } from "@/lib/notes";
import {
  createEditorImageHandlers,
  createNoteEditorExtensions,
} from "@/lib/noteEditorSetup";
import { microLabel } from "@/lib/ui";
import { NoteImageTokenContext } from "./NoteImageExtension";
import NoteImageBubbleMenu from "./NoteImageBubbleMenu";

interface SharedEditorBodyProps {
  idToken: string | null;
  onImageError: (message: string) => void;
  onEditorFocus: (editor: Editor) => void;
}

interface PlainNoteEditorBodyProps extends SharedEditorBodyProps {
  content: JSONContent;
  resetKey: string;
  onContentChange: (content: JSONContent) => void;
}

export default function PlainNoteEditorBody({
  content,
  resetKey,
  onContentChange,
  onEditorFocus,
  idToken,
  onImageError,
}: PlainNoteEditorBodyProps) {
  const editorRef = useRef<Editor | null>(null);

  const editor = useEditor({
    extensions: createNoteEditorExtensions(EDITOR_EXTENSIONS_CONFIG.plainPlaceholder),
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "note-editor-prose outline-none min-h-[24rem]",
      },
      ...createEditorImageHandlers(() => editorRef.current, idToken, onImageError),
    },
    onCreate: ({ editor: ed }) => {
      editorRef.current = ed;
    },
    onDestroy: () => {
      editorRef.current = null;
    },
    onUpdate: ({ editor: ed }) => {
      onContentChange(ed.getJSON());
    },
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, editor]);

  useEffect(() => {
    if (!editor) return;
    const handleFocus = () => onEditorFocus(editor);
    editor.on("focus", handleFocus);
    handleFocus();
    return () => {
      editor.off("focus", handleFocus);
    };
  }, [editor, onEditorFocus]);

  return (
    <NoteImageTokenContext.Provider value={idToken}>
      <div className="note-editor-surface note-editor-plain">
        {editor && <NoteImageBubbleMenu editor={editor} pluginKey="noteImageMenuPlain" />}
        <EditorContent editor={editor} />
      </div>
    </NoteImageTokenContext.Provider>
  );
}

interface CornellNoteEditorBodyProps extends SharedEditorBodyProps {
  content: CornellContent;
  resetKey: string;
  onContentChange: (content: CornellContent) => void;
}

function useCornellRegionEditor(
  initialContent: JSONContent,
  placeholder: string,
  resetKey: string,
  idToken: string | null,
  onImageError: (message: string) => void,
  onRegionChange: () => void,
  onEditorFocus: (editor: Editor) => void
) {
  const editorRef = useRef<Editor | null>(null);

  const editor = useEditor({
    extensions: createNoteEditorExtensions(placeholder),
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "note-editor-prose outline-none min-h-full",
      },
      ...createEditorImageHandlers(() => editorRef.current, idToken, onImageError),
    },
    onCreate: ({ editor: ed }) => {
      editorRef.current = ed;
    },
    onDestroy: () => {
      editorRef.current = null;
    },
    onUpdate: () => {
      onRegionChange();
    },
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.commands.setContent(initialContent, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, editor]);

  useEffect(() => {
    if (!editor) return;
    const handleFocus = () => onEditorFocus(editor);
    editor.on("focus", handleFocus);
    return () => {
      editor.off("focus", handleFocus);
    };
  }, [editor, onEditorFocus]);

  return editor;
}

export function CornellNoteEditorBody({
  content,
  resetKey,
  onContentChange,
  onEditorFocus,
  idToken,
  onImageError,
}: CornellNoteEditorBodyProps) {
  const editorsRef = useRef<{ cue: Editor | null; notes: Editor | null; summary: Editor | null }>({
    cue: null,
    notes: null,
    summary: null,
  });

  const emitChange = useCallback(() => {
    const { cue, notes, summary } = editorsRef.current;
    if (!cue || !notes || !summary) return;
    onContentChange({
      cue: cue.getJSON(),
      notes: notes.getJSON(),
      summary: summary.getJSON(),
    });
  }, [onContentChange]);

  const cueEditor = useCornellRegionEditor(
    content.cue,
    EDITOR_EXTENSIONS_CONFIG.cuePlaceholder,
    resetKey,
    idToken,
    onImageError,
    emitChange,
    onEditorFocus
  );
  const notesEditor = useCornellRegionEditor(
    content.notes,
    EDITOR_EXTENSIONS_CONFIG.notesPlaceholder,
    resetKey,
    idToken,
    onImageError,
    emitChange,
    onEditorFocus
  );
  const summaryEditor = useCornellRegionEditor(
    content.summary,
    EDITOR_EXTENSIONS_CONFIG.summaryPlaceholder,
    resetKey,
    idToken,
    onImageError,
    emitChange,
    onEditorFocus
  );

  useEffect(() => {
    editorsRef.current = { cue: cueEditor, notes: notesEditor, summary: summaryEditor };
  }, [cueEditor, notesEditor, summaryEditor]);

  useEffect(() => {
    if (notesEditor) onEditorFocus(notesEditor);
  }, [notesEditor, onEditorFocus]);

  return (
    <NoteImageTokenContext.Provider value={idToken}>
      <div className="note-editor-cornell">
        <div className="cornell-cue">
          <span className={`${microLabel} cornell-region-label`}>Cue</span>
          {cueEditor && <NoteImageBubbleMenu editor={cueEditor} pluginKey="noteImageMenuCue" />}
          <EditorContent editor={cueEditor} />
        </div>
        <div className="cornell-notes">
          <span className={`${microLabel} cornell-region-label`}>Notes</span>
          {notesEditor && <NoteImageBubbleMenu editor={notesEditor} pluginKey="noteImageMenuNotes" />}
          <EditorContent editor={notesEditor} />
        </div>
        <div className="cornell-summary">
          <span className={`${microLabel} cornell-region-label`}>Summary</span>
          {summaryEditor && (
            <NoteImageBubbleMenu editor={summaryEditor} pluginKey="noteImageMenuSummary" />
          )}
          <EditorContent editor={summaryEditor} />
        </div>
      </div>
    </NoteImageTokenContext.Provider>
  );
}
