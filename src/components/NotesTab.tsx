"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Plus, Trash2, StickyNote, FileText, ScrollText } from "lucide-react";
import { Lecture, Note, NoteFormat, Subject } from "@/lib/types";
import { btnPrimary, microLabel, panel } from "@/lib/ui";
import NoteFilter from "./NoteFilter";
import LecturePicker from "./LecturePicker";
import NoteEditor from "./NoteEditor";

interface NotesTabProps {
  notes: Note[];
  subjects: Subject[];
  lectures: Lecture[];
  getSubject: (id: string) => Subject | undefined;
  onAddNote: (data: {
    title: string;
    lectureId?: string | null;
    format?: NoteFormat;
  }) => Promise<Note | undefined>;
  onDeleteNote: (id: string) => void;
  onUpdateNote: (id: string, updates: Partial<Omit<Note, "id" | "createdAt">>) => void;
  onQuickCreateLecture: (data: {
    subjectId: string;
    title: string;
  }) => Promise<Lecture | undefined>;
  selectedNoteId: string | null;
  onSelectedNoteIdChange: (id: string | null) => void;
  idToken: string | null;
}

type NewNoteStep = "idle" | "choose" | "pick-lecture";

const FORMAT_LABELS: Partial<Record<NoteFormat, string>> = {
  cornell: "Cornell",
};

function FormatBadge({ format }: { format: NoteFormat }) {
  if (format === "plain") return null;
  const label = FORMAT_LABELS[format];
  if (!label) return null;
  return (
    <span className="badge badge-quiet inline-flex items-center gap-1">
      <ScrollText className="h-3 w-3" />
      {label}
    </span>
  );
}

function AttachmentBadge({
  note,
  subject,
}: {
  note: Note;
  subject: Subject | undefined;
}) {
  if (!note.lectureId || !subject) {
    return <span className="badge badge-quiet">Unattached</span>;
  }
  return (
    <span className="badge badge-quiet inline-flex items-center gap-1.5">
      <span className="h-2 w-2 shrink-0" style={{ backgroundColor: subject.color }} />
      {subject.name}
    </span>
  );
}

export default function NotesTab({
  notes,
  subjects,
  lectures,
  getSubject,
  onAddNote,
  onDeleteNote,
  onUpdateNote,
  onQuickCreateLecture,
  selectedNoteId,
  onSelectedNoteIdChange,
  idToken,
}: NotesTabProps) {
  const [newNoteStep, setNewNoteStep] = useState<NewNoteStep>("idle");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string | "all">("all");
  const [lectureFilter, setLectureFilter] = useState<string | "all">("all");

  const lectureById = useMemo(() => {
    const map = new Map<string, Lecture>();
    lectures.forEach((l) => map.set(l.id, l));
    return map;
  }, [lectures]);

  const filtered = useMemo(() => {
    let result = notes;
    if (subjectFilter !== "all") {
      result = result.filter((n) => {
        if (!n.lectureId) return false;
        const lecture = lectureById.get(n.lectureId);
        return lecture?.subjectId === subjectFilter;
      });
    }
    if (lectureFilter !== "all") {
      result = result.filter((n) => n.lectureId === lectureFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((n) => n.title.toLowerCase().includes(q));
    }
    return result.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [notes, subjectFilter, lectureFilter, search, lectureById]);

  const resetNewNote = () => setNewNoteStep("idle");

  const handleBlankNote = async () => {
    const created = await onAddNote({ title: "Untitled note", lectureId: null });
    resetNewNote();
    if (created) onSelectedNoteIdChange(created.id);
  };

  const handleLectureSelect = async (lecture: Lecture) => {
    const created = await onAddNote({ title: lecture.title, lectureId: lecture.id });
    resetNewNote();
    if (created) onSelectedNoteIdChange(created.id);
  };

  const selectedNote = selectedNoteId
    ? notes.find((n) => n.id === selectedNoteId) ?? null
    : null;

  if (selectedNote) {
    return (
      <NoteEditor
        note={selectedNote}
        subjects={subjects}
        lectures={lectures}
        idToken={idToken}
        getSubject={getSubject}
        onUpdate={onUpdateNote}
        onBack={() => onSelectedNoteIdChange(null)}
        onQuickCreateLecture={onQuickCreateLecture}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg" style={{ color: "var(--foreground)" }}>
            Notes
          </h2>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Capture and organize lecture notes
          </p>
        </div>
        {newNoteStep === "idle" && (
          <button
            type="button"
            onClick={() => setNewNoteStep("choose")}
            className={btnPrimary}
          >
            <Plus className="h-3.5 w-3.5" />
            New note
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {newNoteStep === "choose" && (
          <motion.div
            key="choose"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={`${panel} space-y-4`}>
              <p className={microLabel}>What kind of note?</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleBlankNote}
                  className="panel-inset p-4 text-left transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--foreground)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-color)";
                  }}
                >
                  <StickyNote
                    className="mb-2 h-5 w-5"
                    style={{ color: "var(--foreground)" }}
                  />
                  <span className="font-display block text-sm" style={{ color: "var(--foreground)" }}>
                    Blank note
                  </span>
                  <span className="mt-1 block text-xs" style={{ color: "var(--muted-foreground)" }}>
                    Standalone note — attach to a lecture later if you want
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewNoteStep("pick-lecture")}
                  className="panel-inset p-4 text-left transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--foreground)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-color)";
                  }}
                >
                  <FileText
                    className="mb-2 h-5 w-5"
                    style={{ color: "var(--foreground)" }}
                  />
                  <span className="font-display block text-sm" style={{ color: "var(--foreground)" }}>
                    Notes for a lecture
                  </span>
                  <span className="mt-1 block text-xs" style={{ color: "var(--muted-foreground)" }}>
                    Pick a backlog lecture — title prefilled from the lecture
                  </span>
                </button>
              </div>
              <button type="button" onClick={resetNewNote} className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {newNoteStep === "pick-lecture" && (
          <LecturePicker
            key="pick-lecture"
            subjects={subjects}
            lectures={lectures}
            onSelect={handleLectureSelect}
            onQuickCreate={onQuickCreateLecture}
            onCancel={resetNewNote}
          />
        )}
      </AnimatePresence>

      <NoteFilter
        search={search}
        onSearchChange={setSearch}
        subjectFilter={subjectFilter}
        onSubjectFilterChange={setSubjectFilter}
        lectureFilter={lectureFilter}
        onLectureFilterChange={setLectureFilter}
        subjects={subjects}
        lectures={lectures}
      />

      {filtered.length === 0 ? (
        <div className="empty-state py-16">
          <StickyNote className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--muted-foreground)" }} />
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {notes.length === 0
              ? "No notes yet. Create one to get started."
              : "No notes match your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((note) => {
              const lecture = note.lectureId ? lectureById.get(note.lectureId) : undefined;
              const subject = lecture ? getSubject(lecture.subjectId) : undefined;

              return (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectedNoteIdChange(note.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectedNoteIdChange(note.id);
                    }
                  }}
                  className={`${panel} group flex cursor-pointer items-center justify-between gap-4 py-4 transition-colors`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "color-mix(in oklch, var(--border) 60%, transparent)";
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className="font-display truncate text-sm"
                        style={{ color: "var(--foreground)" }}
                      >
                        {note.title || "Untitled note"}
                      </h3>
                      <FormatBadge format={note.format} />
                      <AttachmentBadge note={note} subject={subject} />
                    </div>
                    {lecture && (
                      <p
                        className="mt-1 truncate text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {lecture.title}
                      </p>
                    )}
                    <p className="mt-1 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                      Updated {format(new Date(note.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNote(note.id);
                    }}
                    className="btn-icon btn-danger-ghost shrink-0 opacity-0 transition-all group-hover:opacity-100"
                    title="Delete note"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
