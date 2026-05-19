"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, X, Check, Tag } from "lucide-react";
import { Subject, Priority, Lecture } from "@/lib/types";
import { WEEK_NUMBERS, formatWeekTitle, parseWeekNumber } from "@/lib/weeks";
import SubjectBadge from "./SubjectBadge";

interface AddLectureFormProps {
  subjects: Subject[];
  lectures: Lecture[];
  onAdd: (data: {
    subjectId: string;
    title: string;
    notes?: string;
    priority?: Priority;
    duration?: number | null;
    lectureDate?: string | null;
    tags?: string[];
  }) => void;
}

export default function AddLectureForm({ subjects, lectures, onAdd }: AddLectureFormProps) {
  const [open, setOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(new Set());
  const [priority, setPriority] = useState<Priority>("medium");
  const [duration, setDuration] = useState("");
  const [lectureDate, setLectureDate] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const reset = () => {
    setSelectedWeek(null);
    setSelectedSubjectIds(new Set());
    setPriority("medium");
    setDuration("");
    setLectureDate("");
    setTagInput("");
    setTags([]);
    setNotes("");
    setOpen(false);
  };

  const existingSubjectIdsForWeek = useMemo(() => {
    if (selectedWeek === null) return new Set<string>();
    return new Set(
      lectures
        .filter((l) => parseWeekNumber(l.title) === selectedWeek)
        .map((l) => l.subjectId)
    );
  }, [lectures, selectedWeek]);

  const toggleSubject = (id: string) => {
    if (existingSubjectIdsForWeek.has(id)) return;
    setSelectedSubjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const newSubjectCount = selectedSubjectIds.size;
  const allTakenForWeek =
    selectedWeek !== null &&
    subjects.length > 0 &&
    subjects.every((s) => existingSubjectIdsForWeek.has(s.id));

  const handleSubmit = () => {
    if (selectedWeek === null || newSubjectCount === 0) return;
    const title = formatWeekTitle(selectedWeek);
    for (const subjectId of selectedSubjectIds) {
      onAdd({
        subjectId,
        title,
        notes: notes.trim(),
        priority,
        duration: duration ? parseInt(duration) : null,
        lectureDate: lectureDate || null,
        tags,
      });
    }
    reset();
  };

  if (!open) {
    return (
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-sm transition-all hover:border-indigo-500/30 hover:bg-indigo-500/5 hover:text-indigo-400"
        style={{ borderColor: "var(--border-color)", color: "var(--muted-fg)" }}
      >
        <Plus className="h-4 w-4" />
        Add Lecture
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-2xl border p-5 backdrop-blur-sm"
      style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>New Lecture</h3>
        <button onClick={reset} className="rounded-md p-1" style={{ color: "var(--muted-fg)" }}>
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs" style={{ color: "var(--muted-fg)" }}>Week</label>
          <div className="grid grid-cols-4 gap-1.5">
            {WEEK_NUMBERS.map((w) => (
              <button
                key={w}
                onClick={() => {
                  setSelectedWeek(w);
                  setSelectedSubjectIds(new Set());
                }}
                className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-all ${
                  selectedWeek === w
                    ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-400"
                    : ""
                }`}
                style={
                  selectedWeek !== w
                    ? { borderColor: "var(--border-color)", background: "var(--surface)", color: "var(--muted-fg)" }
                    : undefined
                }
              >
                Week {w}
              </button>
            ))}
          </div>
        </div>

        {selectedWeek !== null && (
          <div>
            <label className="mb-1.5 block text-xs" style={{ color: "var(--muted-fg)" }}>Subjects</label>
            {subjects.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--card-text-secondary)" }}>
                Add subjects in the sidebar first.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {subjects.map((s) => {
                  const alreadyExists = existingSubjectIdsForWeek.has(s.id);
                  const isSelected = selectedSubjectIds.has(s.id);
                  return (
                    <div key={s.id} className={alreadyExists ? "opacity-40" : ""}>
                      <SubjectBadge
                        name={alreadyExists ? `${s.name} ✓` : s.name}
                        color={s.color}
                        active={isSelected}
                        onClick={() => toggleSubject(s.id)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            {allTakenForWeek && (
              <p className="mt-1.5 text-[11px]" style={{ color: "var(--card-text-secondary)" }}>
                All subjects added for this week.
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs" style={{ color: "var(--muted-fg)" }}>Priority</label>
            <div className="flex gap-1">
              {(["low", "medium", "high"] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium capitalize transition-all ${
                    priority === p
                      ? p === "high"
                        ? "border-red-500/30 bg-red-500/10 text-red-400"
                        : p === "medium"
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                        : "border-zinc-500/30 bg-zinc-500/10 text-zinc-400"
                      : ""
                  }`}
                  style={priority !== p ? { borderColor: "var(--border-color)", background: "var(--surface)", color: "var(--muted-fg)" } : undefined}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="w-24">
            <label className="mb-1 block text-xs" style={{ color: "var(--muted-fg)" }}>Duration</label>
            <input
              value={duration}
              onChange={(e) => setDuration(e.target.value.replace(/\D/g, ""))}
              placeholder="min"
              className="w-full rounded-lg border px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
              style={{ background: "var(--input-bg)", borderColor: "var(--border-color)", color: "var(--fg)" }}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs" style={{ color: "var(--muted-fg)" }}>Lecture Date</label>
          <input
            type="date"
            value={lectureDate}
            onChange={(e) => setLectureDate(e.target.value)}
            className="w-full rounded-lg border px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
            style={{ background: "var(--input-bg)", borderColor: "var(--border-color)", color: "var(--fg)" }}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs" style={{ color: "var(--muted-fg)" }}>Tags</label>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Add tag..."
              className="flex-1 rounded-lg border px-3 py-1.5 text-xs outline-none focus:border-indigo-500/50"
              style={{ background: "var(--input-bg)", borderColor: "var(--border-color)", color: "var(--fg)" }}
            />
            <button onClick={addTag} className="rounded-lg px-2" style={{ background: "var(--surface-hover)", color: "var(--muted-fg)" }}>
              <Tag className="h-3.5 w-3.5" />
            </button>
          </div>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px]"
                  style={{ background: "var(--surface-hover)", color: "var(--muted-fg)" }}
                >
                  {tag}
                  <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="hover:opacity-80" style={{ color: "var(--card-text-secondary)" }}>
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs" style={{ color: "var(--muted-fg)" }}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Quick notes..."
            className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500/50"
            style={{ background: "var(--input-bg)", borderColor: "var(--border-color)", color: "var(--fg)" }}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={selectedWeek === null || newSubjectCount === 0}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-40"
          >
            <Check className="h-4 w-4" />
            {newSubjectCount > 0
              ? `Add ${newSubjectCount} lecture${newSubjectCount !== 1 ? "s" : ""}`
              : "Add Lecture"}
          </button>
          <button
            onClick={reset}
            className="rounded-lg px-4 py-2 text-sm transition-colors"
            style={{ background: "var(--surface-hover)", color: "var(--muted-fg)" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
}
