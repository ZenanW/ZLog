"use client";

import { StickyNote, Plus } from "lucide-react";
import { Note } from "@/lib/types";
import { btnSecondary, microLabel } from "@/lib/ui";

interface LectureNotesSectionProps {
  notes: Note[];
  onOpenNote: (noteId: string) => void;
  onTakeNotes: () => void;
}

export default function LectureNotesSection({
  notes,
  onOpenNote,
  onTakeNotes,
}: LectureNotesSectionProps) {
  return (
    <div>
      <label className={`${microLabel} mb-2 flex items-center gap-1`}>
        <StickyNote className="h-3 w-3" />
        Notes
      </label>
      {notes.length === 0 ? (
        <button type="button" onClick={onTakeNotes} className={`${btnSecondary} w-full justify-center`}>
          <Plus className="h-3.5 w-3.5" />
          Take notes
        </button>
      ) : (
        <div className="space-y-1">
          {notes.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => onOpenNote(note.id)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors"
              style={{ color: "var(--foreground)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "color-mix(in oklch, var(--accent) 40%, transparent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <StickyNote className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--muted-foreground)" }} />
              <span className="font-display truncate">{note.title || "Untitled note"}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={onTakeNotes}
            className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-xs transition-colors"
            style={{ color: "var(--muted-foreground)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "color-mix(in oklch, var(--accent) 40%, transparent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            New note
          </button>
        </div>
      )}
    </div>
  );
}
