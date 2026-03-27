"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Pencil, Trash2, Check } from "lucide-react";
import { Subject } from "@/lib/types";
import { SUBJECT_COLORS } from "@/lib/colors";

interface SubjectManagerProps {
  subjects: Subject[];
  onAdd: (name: string, color: string) => void;
  onUpdate: (id: string, updates: Partial<Pick<Subject, "name" | "color">>) => void;
  onDelete: (id: string) => void;
  lectureCountBySubject: Record<string, number>;
}

export default function SubjectManager({ subjects, onAdd, onUpdate, onDelete, lectureCountBySubject }: SubjectManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(SUBJECT_COLORS[0]);

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), color);
    setName("");
    setColor(SUBJECT_COLORS[(subjects.length + 1) % SUBJECT_COLORS.length]);
    setIsAdding(false);
  };

  const handleUpdate = (id: string) => {
    if (!name.trim()) return;
    onUpdate(id, { name: name.trim(), color });
    setEditingId(null);
    setName("");
  };

  const startEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setName(subject.name);
    setColor(subject.color);
    setIsAdding(false);
  };

  const cancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setName("");
  };

  return (
    <div className="rounded-2xl border p-5 backdrop-blur-sm" style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--muted-fg)" }}>Subjects</h2>
        {!isAdding && !editingId && (
          <button
            onClick={() => {
              setIsAdding(true);
              setColor(SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length]);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {(isAdding || editingId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="space-y-3 rounded-xl border p-3" style={{ background: "var(--surface-hover)", borderColor: "var(--border-color)" }}>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") editingId ? handleUpdate(editingId) : handleAdd();
                  if (e.key === "Escape") cancel();
                }}
                placeholder="Subject name..."
                className="w-full rounded-lg border px-3 py-2 text-sm placeholder-zinc-500 outline-none focus:border-indigo-500/50"
                style={{ background: "var(--input-bg)", borderColor: "var(--border-color)", color: "var(--fg)" }}
              />
              <div className="flex flex-wrap gap-1.5">
                {SUBJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-6 w-6 rounded-full transition-all ${
                      color === c ? "scale-110 ring-2 ring-indigo-400 ring-offset-1 ring-offset-[var(--bg)]" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => (editingId ? handleUpdate(editingId) : handleAdd())}
                  disabled={!name.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-40"
                >
                  <Check className="h-3.5 w-3.5" />
                  {editingId ? "Update" : "Add"}
                </button>
                <button
                  onClick={cancel}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{ background: "var(--surface-hover)", color: "var(--muted-fg)" }}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-1">
        {subjects.length === 0 && !isAdding && (
          <p className="py-4 text-center text-sm" style={{ color: "var(--card-text-secondary)" }}>No subjects yet. Add one to get started.</p>
        )}
        <AnimatePresence>
          {subjects.map((subject) => (
            <motion.div
              key={subject.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="group flex items-center justify-between rounded-lg px-3 py-2 transition-colors"
              style={{ ["--tw-bg-opacity" as string]: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: subject.color }} />
                <span className="text-sm" style={{ color: "var(--fg)" }}>{subject.name}</span>
                <span className="text-xs" style={{ color: "var(--card-text-secondary)" }}>
                  {lectureCountBySubject[subject.id] ?? 0}
                </span>
              </div>
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => startEdit(subject)}
                  className="rounded-md p-1 transition-colors" style={{ color: "var(--muted-fg)" }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDelete(subject.id)}
                  className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
