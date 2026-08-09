"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Pencil, Trash2, Check } from "lucide-react";
import { Subject } from "@/lib/types";
import { SUBJECT_COLORS } from "@/lib/colors";
import { btnPrimary, btnSecondary, microLabel, panel } from "@/lib/ui";

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
    <div className={panel}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className={microLabel}>Subjects</h2>
        {!isAdding && !editingId && (
          <button
            onClick={() => {
              setIsAdding(true);
              setColor(SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length]);
            }}
            className="btn btn-secondary flex items-center gap-1.5"
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
            <div className="panel-inset space-y-3 p-3">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (editingId) handleUpdate(editingId);
                    else handleAdd();
                  }
                  if (e.key === "Escape") cancel();
                }}
                placeholder="Subject name..."
                className="input-field w-full px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-1.5">
                {SUBJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-6 w-6 transition-all ${
                      color === c ? "ring-2 ring-offset-1" : "hover:opacity-80"
                    }`}
                    style={{
                      backgroundColor: c,
                      ...(color === c ? { outlineColor: "var(--foreground)", outlineWidth: 2, outlineStyle: "solid" } : {}),
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => (editingId ? handleUpdate(editingId) : handleAdd())}
                  disabled={!name.trim()}
                  className={btnPrimary}
                >
                  <Check className="h-3.5 w-3.5" />
                  {editingId ? "Update" : "Add"}
                </button>
                <button onClick={cancel} className={btnSecondary}>
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
          <div className="empty-state py-8">
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No subjects yet. Add one to get started.</p>
          </div>
        )}
        <AnimatePresence>
          {subjects.map((subject) => (
            <motion.div
              key={subject.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="group flex items-center justify-between px-3 py-2 transition-colors hover:bg-[color-mix(in_oklch,var(--accent)_40%,transparent)]"
            >
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 shrink-0" style={{ backgroundColor: subject.color }} />
                <span className="text-sm" style={{ color: "var(--foreground)" }}>{subject.name}</span>
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {lectureCountBySubject[subject.id] ?? 0}
                </span>
              </div>
              <div className="flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <button onClick={() => startEdit(subject)} className="btn-icon">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onDelete(subject.id)} className="btn-icon btn-danger-ghost">
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
