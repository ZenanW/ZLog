"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Check, Tag } from "lucide-react";
import { Subject, Priority } from "@/lib/types";

interface AddLectureFormProps {
  subjects: Subject[];
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

export default function AddLectureForm({ subjects, onAdd }: AddLectureFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [duration, setDuration] = useState("");
  const [lectureDate, setLectureDate] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const reset = () => {
    setTitle("");
    setSubjectId("");
    setPriority("medium");
    setDuration("");
    setLectureDate("");
    setTagInput("");
    setTags([]);
    setNotes("");
    setOpen(false);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !subjectId) return;
    onAdd({
      subjectId,
      title: title.trim(),
      notes: notes.trim(),
      priority,
      duration: duration ? parseInt(duration) : null,
      lectureDate: lectureDate || null,
      tags,
    });
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
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lecture title..."
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500/50"
          style={{ background: "var(--input-bg)", borderColor: "var(--border-color)", color: "var(--fg)" }}
        />

        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500/50"
          style={{ background: "var(--input-bg)", borderColor: "var(--border-color)", color: "var(--fg)" }}
        >
          <option value="">Select subject...</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

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
            disabled={!title.trim() || !subjectId}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-40"
          >
            <Check className="h-4 w-4" />
            Add Lecture
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
