"use client";

import { useEffect, useState, type ElementType } from "react";
import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { AlignCenter, AlignLeft, AlignRight, Square } from "lucide-react";
import {
  NOTE_IMAGE_WRAP_MODES,
  NOTE_IMAGE_WRAP_LABELS,
  NoteImageWrapMode,
  normalizeNoteImageWrapMode,
} from "@/lib/noteImages";
import { filterActive, filterInactive } from "@/lib/ui";

const WRAP_ICONS: Record<NoteImageWrapMode, ElementType> = {
  block: Square,
  left: AlignLeft,
  right: AlignRight,
  center: AlignCenter,
};

function useImageWrapMode(editor: Editor | null): NoteImageWrapMode {
  const [wrapMode, setWrapMode] = useState<NoteImageWrapMode>("block");

  useEffect(() => {
    if (!editor) return;
    const sync = () => {
      if (editor.isActive("image")) {
        setWrapMode(normalizeNoteImageWrapMode(editor.getAttributes("image").wrapMode));
      }
    };
    sync();
    editor.on("selectionUpdate", sync);
    editor.on("transaction", sync);
    return () => {
      editor.off("selectionUpdate", sync);
      editor.off("transaction", sync);
    };
  }, [editor]);

  return wrapMode;
}

interface NoteImageBubbleMenuProps {
  editor: Editor | null;
  pluginKey: string;
}

export default function NoteImageBubbleMenu({ editor, pluginKey }: NoteImageBubbleMenuProps) {
  const wrapMode = useImageWrapMode(editor);

  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      pluginKey={pluginKey}
      shouldShow={({ editor: ed }) => ed.isActive("image")}
      updateDelay={0}
      options={{
        placement: "top",
        strategy: "fixed",
        offset: 8,
        flip: { padding: 8 },
        shift: { padding: 8 },
      }}
    >
      <div
        className="note-image-bubble-menu"
        contentEditable={false}
        onMouseDown={(e) => e.preventDefault()}
      >
        {NOTE_IMAGE_WRAP_MODES.map((mode) => {
          const Icon = WRAP_ICONS[mode];
          return (
            <button
              key={mode}
              type="button"
              title={NOTE_IMAGE_WRAP_LABELS[mode]}
              onClick={() =>
                editor.chain().focus().updateAttributes("image", { wrapMode: mode }).run()
              }
              className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded ${
                wrapMode === mode ? filterActive : filterInactive
              }`}
            >
              <Icon className="h-3 w-3" />
              {NOTE_IMAGE_WRAP_LABELS[mode]}
            </button>
          );
        })}
      </div>
    </BubbleMenu>
  );
}
